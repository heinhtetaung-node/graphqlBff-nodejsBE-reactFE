const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const PROTO_PATH = path.join(__dirname, "../../../protos/user.proto");
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

function toProtoUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone || "",
    avatarUrl: row.avatar_url || "",
    bio: row.bio || "",
    companyId: row.company_id || "",
    skills: row.skills || [],
    resumeUrl: row.resume_url || "",
    createdAt: row.created_at?.toISOString() || "",
    updatedAt: row.updated_at?.toISOString() || "",
  };
}

const handlers = {
  async CreateUser(call, callback) {
    try {
      const { email, password, name, role, phone, bio, companyId, skills } =
        call.request;

      if (!["TALENT_HUNTER", "JOB_HUNTER"].includes(role)) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Role must be TALENT_HUNTER or JOB_HUNTER",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const [row] = await db("users")
        .insert({
          id,
          email,
          password_hash: passwordHash,
          name,
          role,
          phone,
          bio,
          company_id: companyId || null,
          skills: skills || [],
        })
        .returning("*");
      callback(null, { user: toProtoUser(row) });
    } catch (err) {
      if (err.code === "23505") {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: "Email already registered",
        });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetUser(call, callback) {
    try {
      const row = await db("users").where("id", call.request.id).first();
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "User not found",
        });
      callback(null, { user: toProtoUser(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetUserByEmail(call, callback) {
    try {
      const row = await db("users").where("email", call.request.email).first();
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "User not found",
        });
      callback(null, { user: toProtoUser(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ListUsers(call, callback) {
    try {
      const { page = 1, limit = 20, role } = call.request;
      const offset = (page - 1) * limit;
      let query = db("users");
      if (role) query = query.where("role", role);
      const [{ count }] = await query.clone().count();
      const rows = await query
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);
      callback(null, { users: rows.map(toProtoUser), total: parseInt(count) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async UpdateUser(call, callback) {
    try {
      const { id, name, phone, avatarUrl, bio, companyId, skills, resumeUrl } =
        call.request;
      const updates = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (avatarUrl) updates.avatar_url = avatarUrl;
      if (bio) updates.bio = bio;
      if (companyId) updates.company_id = companyId;
      if (skills && skills.length) updates.skills = skills;
      if (resumeUrl) updates.resume_url = resumeUrl;
      updates.updated_at = new Date();

      const [row] = await db("users")
        .where("id", id)
        .update(updates)
        .returning("*");
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "User not found",
        });
      callback(null, { user: toProtoUser(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async DeleteUser(call, callback) {
    try {
      const deleted = await db("users").where("id", call.request.id).del();
      callback(null, { success: deleted > 0 });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async Login(call, callback) {
    try {
      const { email, password } = call.request;
      const row = await db("users").where("email", email).first();
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Invalid credentials",
        });

      const valid = await bcrypt.compare(password, row.password_hash);
      if (!valid)
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Invalid credentials",
        });

      const token = jwt.sign({ userId: row.id, role: row.role }, JWT_SECRET, {
        expiresIn: "24h",
      });
      callback(null, { token, user: toProtoUser(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main() {
  const server = new grpc.Server();
  server.addService(userProto.UserService.service, handlers);

  const port = process.env.GRPC_PORT || "50053";
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) {
        console.error("Failed to bind server:", err);
        process.exit(1);
      }
      console.log(`User service running on port ${port}`);
    },
  );
}

main();
