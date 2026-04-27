import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import type pino from "pino";
import db from "./db";
import { config } from "./config";
import { CompanyRepository, ReviewRepository } from "./repository";
import { createLogger } from "../../../shared/src/logger";
import { addHealthCheck } from "../../../shared/src/health";
import { gracefulShutdown } from "../../../shared/src/shutdown";
import { initTracing } from "../../../shared/src/tracing";

initTracing("company-service");
const logger: pino.Logger = createLogger("company-service");

const PROTO_PATH = path.join(__dirname, "../../../protos/company.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const companyProto = grpc.loadPackageDefinition(packageDefinition)
  .company as any;

const companyRepo = new CompanyRepository(db);
const reviewRepo = new ReviewRepository(db);

const handlers: grpc.UntypedServiceImplementation = {
  async CreateCompany(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const company = await companyRepo.create(call.request);
      callback(null, { company });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetCompany(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const company = await companyRepo.findById(call.request.id);
      if (!company) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Company not found",
        });
      }
      callback(null, { company });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ListCompanies(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const result = await companyRepo.list(call.request);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async UpdateCompany(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const company = await companyRepo.update(call.request);
      if (!company) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Company not found",
        });
      }
      callback(null, { company });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async DeleteCompany(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const success = await companyRepo.delete(call.request.id);
      callback(null, { success });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async CreateReview(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const { rating } = call.request;
      if (rating < 1 || rating > 5) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Rating must be between 1 and 5",
        });
      }
      const review = await reviewRepo.create(call.request);
      callback(null, { review });
    } catch (err: any) {
      if (err.constraint === "reviews_company_id_user_id_unique") {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: "You have already reviewed this company",
        });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ListReviews(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const result = await reviewRepo.list(call.request);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main(): void {
  const server = new grpc.Server();
  server.addService(companyProto.CompanyService.service, handlers);

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
      logger.info({ port }, "Company service running");
    },
  );

  gracefulShutdown(server, db, logger);
}

main();
