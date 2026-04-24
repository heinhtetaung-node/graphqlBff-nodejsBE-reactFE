const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const { createLogger } = require("../../../shared/logger");
const { addHealthCheck } = require("../../../shared/health");
const { gracefulShutdown } = require("../../../shared/shutdown");

const logger = createLogger("company-service");
const PROTO_PATH = path.join(__dirname, "../../../protos/company.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const companyProto = grpc.loadPackageDefinition(packageDefinition).company;

function toProtoCompany(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    website: row.website || "",
    industry: row.industry || "",
    logoUrl: row.logo_url || "",
    location: row.location || "",
    employeeCount: row.employee_count || 0,
    createdAt: row.created_at?.toISOString() || "",
    updatedAt: row.updated_at?.toISOString() || "",
  };
}

const handlers = {
  async CreateCompany(call, callback) {
    try {
      const {
        name,
        description,
        website,
        industry,
        logoUrl,
        location,
        employeeCount,
      } = call.request;
      const id = uuidv4();
      const [row] = await db("companies")
        .insert({
          id,
          name,
          description,
          website,
          industry,
          logo_url: logoUrl,
          location,
          employee_count: employeeCount,
        })
        .returning("*");
      callback(null, { company: toProtoCompany(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetCompany(call, callback) {
    try {
      const row = await db("companies").where("id", call.request.id).first();
      if (!row) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Company not found",
        });
      }
      callback(null, { company: toProtoCompany(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ListCompanies(call, callback) {
    try {
      const { page = 1, limit = 20, industry } = call.request;
      const offset = (page - 1) * limit;
      let query = db("companies");
      if (industry) query = query.where("industry", industry);
      const [{ count }] = await query.clone().count();
      const rows = await query
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);
      callback(null, {
        companies: rows.map(toProtoCompany),
        total: parseInt(count),
      });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async UpdateCompany(call, callback) {
    try {
      const {
        id,
        name,
        description,
        website,
        industry,
        logoUrl,
        location,
        employeeCount,
      } = call.request;
      const updates = {};
      if (name) updates.name = name;
      if (description) updates.description = description;
      if (website) updates.website = website;
      if (industry) updates.industry = industry;
      if (logoUrl) updates.logo_url = logoUrl;
      if (location) updates.location = location;
      if (employeeCount) updates.employee_count = employeeCount;
      updates.updated_at = new Date();

      const [row] = await db("companies")
        .where("id", id)
        .update(updates)
        .returning("*");
      if (!row) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Company not found",
        });
      }
      callback(null, { company: toProtoCompany(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async DeleteCompany(call, callback) {
    try {
      const deleted = await db("companies").where("id", call.request.id).del();
      callback(null, { success: deleted > 0 });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main() {
  const server = new grpc.Server();
  server.addService(companyProto.CompanyService.service, handlers);

  const health = addHealthCheck(server, logger);

  const port = process.env.GRPC_PORT || "50051";
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) {
        logger.fatal({ err }, "Failed to bind server");
        process.exit(1);
      }
      health.setServing();
      logger.info({ port }, "Company service running");
    },
  );

  gracefulShutdown(server, db, logger);
}

main();
