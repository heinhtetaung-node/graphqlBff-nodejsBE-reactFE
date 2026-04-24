const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const PROTO_PATH = path.join(__dirname, "../../../protos/subscription.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const subProto = grpc.loadPackageDefinition(packageDefinition).subscription;

const PLAN_CONFIG = {
  TALENT_HUNTER_FREE: { price: 0, actionType: "JOB_POST", maxCount: 10 },
  TALENT_HUNTER_PRO: { price: 30, actionType: "JOB_POST", maxCount: -1 },
  JOB_HUNTER_FREE: { price: 0, actionType: "JOB_APPLY", maxCount: 10 },
  JOB_HUNTER_PRO: { price: 5, actionType: "JOB_APPLY", maxCount: -1 },
};

function getCurrentPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

function toProtoSubscription(row) {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    price: parseFloat(row.price),
    status: row.status,
    startsAt: row.starts_at?.toISOString() || "",
    endsAt: row.ends_at?.toISOString() || "",
    createdAt: row.created_at?.toISOString() || "",
    updatedAt: row.updated_at?.toISOString() || "",
  };
}

function toProtoUsage(row) {
  return {
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type,
    usedCount: row.used_count,
    maxCount: row.max_count,
    periodStart: row.period_start?.toISOString() || "",
    periodEnd: row.period_end?.toISOString() || "",
  };
}

async function getOrCreateUsage(userId, actionType) {
  const { start, end } = getCurrentPeriod();
  let usage = await db("usage")
    .where({ user_id: userId, action_type: actionType })
    .where("period_start", ">=", start)
    .first();

  if (!usage) {
    // Determine max from subscription
    const sub = await db("subscriptions")
      .where({ user_id: userId, status: "ACTIVE" })
      .first();
    const plan = sub ? PLAN_CONFIG[sub.plan] : null;
    const maxCount = plan ? plan.maxCount : 10;

    const [row] = await db("usage")
      .insert({
        id: uuidv4(),
        user_id: userId,
        action_type: actionType,
        used_count: 0,
        max_count: maxCount,
        period_start: start,
        period_end: end,
      })
      .returning("*");
    usage = row;
  }
  return usage;
}

const handlers = {
  async CreateSubscription(call, callback) {
    try {
      const { userId, plan } = call.request;
      const config = PLAN_CONFIG[plan];
      if (!config) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Invalid plan",
        });
      }

      const { start, end } = getCurrentPeriod();
      const id = uuidv4();

      // Upsert subscription
      await db("subscriptions").where("user_id", userId).del();

      const [row] = await db("subscriptions")
        .insert({
          id,
          user_id: userId,
          plan,
          price: config.price,
          status: "ACTIVE",
          starts_at: start,
          ends_at: end,
        })
        .returning("*");

      // Reset usage for this period
      await db("usage")
        .where({ user_id: userId, action_type: config.actionType })
        .where("period_start", ">=", start)
        .update({ max_count: config.maxCount });

      callback(null, { subscription: toProtoSubscription(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetSubscription(call, callback) {
    try {
      const row = await db("subscriptions")
        .where("id", call.request.id)
        .first();
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Subscription not found",
        });
      callback(null, { subscription: toProtoSubscription(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetSubscriptionByUser(call, callback) {
    try {
      const row = await db("subscriptions")
        .where({ user_id: call.request.userId, status: "ACTIVE" })
        .first();
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "No active subscription",
        });
      callback(null, { subscription: toProtoSubscription(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async CancelSubscription(call, callback) {
    try {
      const [row] = await db("subscriptions")
        .where("id", call.request.id)
        .update({ status: "CANCELLED", updated_at: new Date() })
        .returning("*");
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Subscription not found",
        });
      callback(null, { subscription: toProtoSubscription(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async CheckUsageLimit(call, callback) {
    try {
      const { userId, actionType } = call.request;
      const usage = await getOrCreateUsage(userId, actionType);
      const allowed =
        usage.max_count === -1 || usage.used_count < usage.max_count;
      callback(null, {
        allowed,
        usedCount: usage.used_count,
        maxCount: usage.max_count,
      });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async IncrementUsage(call, callback) {
    try {
      const { userId, actionType } = call.request;
      const usage = await getOrCreateUsage(userId, actionType);

      if (usage.max_count !== -1 && usage.used_count >= usage.max_count) {
        return callback({
          code: grpc.status.RESOURCE_EXHAUSTED,
          message: "Usage limit reached",
        });
      }

      const [row] = await db("usage")
        .where("id", usage.id)
        .update({ used_count: usage.used_count + 1 })
        .returning("*");

      callback(null, { usage: toProtoUsage(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetUsage(call, callback) {
    try {
      const { userId, actionType } = call.request;
      const usage = await getOrCreateUsage(userId, actionType);
      callback(null, { usage: toProtoUsage(usage) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main() {
  const server = new grpc.Server();
  server.addService(subProto.SubscriptionService.service, handlers);

  const port = process.env.GRPC_PORT || "50054";
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) {
        console.error("Failed to bind server:", err);
        process.exit(1);
      }
      console.log(`Subscription service running on port ${port}`);
    },
  );
}

main();
