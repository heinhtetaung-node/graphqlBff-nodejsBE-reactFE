import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import type pino from "pino";
import db from "./db";
import { config } from "./config";
import { SubscriptionRepository } from "./repository";
import { createLogger } from "../../../shared/src/logger";
import { addHealthCheck } from "../../../shared/src/health";
import { gracefulShutdown } from "../../../shared/src/shutdown";
import { initTracing } from "../../../shared/src/tracing";

initTracing("subscription-service");
const logger: pino.Logger = createLogger("subscription-service");

const PROTO_PATH = path.join(__dirname, "../../../protos/subscription.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const subProto = grpc.loadPackageDefinition(packageDefinition)
  .subscription as any;

const subRepo = new SubscriptionRepository(db);

const handlers: grpc.UntypedServiceImplementation = {
  async CreateSubscription(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const { userId, plan } = call.request;
      const subscription = await subRepo.createSubscription(userId, plan);
      callback(null, { subscription });
    } catch (err: any) {
      if (err.message === "Invalid plan") {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: err.message,
        });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetSubscription(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const subscription = await subRepo.findById(call.request.id);
      if (!subscription)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Subscription not found",
        });
      callback(null, { subscription });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetSubscriptionByUser(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const subscription = await subRepo.findByUser(call.request.userId);
      if (!subscription)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "No active subscription",
        });
      callback(null, { subscription });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async CancelSubscription(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const subscription = await subRepo.cancel(call.request.id);
      if (!subscription)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Subscription not found",
        });
      callback(null, { subscription });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async CheckUsageLimit(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const { userId, actionType } = call.request;
      const result = await subRepo.checkUsageLimit(userId, actionType);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async IncrementUsage(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const { userId, actionType } = call.request;
      const usage = await subRepo.incrementUsage(userId, actionType);
      callback(null, { usage });
    } catch (err: any) {
      if (err.code === "RESOURCE_EXHAUSTED") {
        return callback({
          code: grpc.status.RESOURCE_EXHAUSTED,
          message: err.message,
        });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetUsage(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const { userId, actionType } = call.request;
      const usage = await subRepo.getUsage(userId, actionType);
      callback(null, { usage });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main(): void {
  const server = new grpc.Server();
  server.addService(subProto.SubscriptionService.service, handlers);

  const health = addHealthCheck(server, logger);
  const port = config.grpcPort;

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) {
        logger.fatal({ err }, "Failed to bind server");
        process.exit(1);
      }
      health.setServing();
      logger.info({ port }, "Subscription service running");
    },
  );

  gracefulShutdown(server, db, logger);
}

main();
