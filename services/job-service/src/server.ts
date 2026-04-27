import * as grpc from "@grpc/grpc-js";
import type pino from "pino";
import db from "./db";
import { config } from "./config";
import { JobRepository, ApplicationRepository } from "./repository";
import { createLogger } from "../../../shared/src/logger";
import { addHealthCheck } from "../../../shared/src/health";
import { gracefulShutdown } from "../../../shared/src/shutdown";
import { initTracing } from "../../../shared/src/tracing";
import {
  JobServiceService,
  type JobServiceServer,
} from "../../../shared/proto-generated/job";

initTracing("job-service");
const logger: pino.Logger = createLogger("job-service");

const jobRepo = new JobRepository(db);
const appRepo = new ApplicationRepository(db);

const handlers: JobServiceServer = {
  async createJob(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const job = await jobRepo.create(call.request);
      callback(null, { job });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async getJob(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const job = await jobRepo.findById(call.request.id);
      if (!job)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Job not found",
        });
      callback(null, { job });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async listJobs(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const result = await jobRepo.list(call.request);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async listJobsByCompany(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const result = await jobRepo.listByCompany(call.request);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async updateJob(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const job = await jobRepo.update(call.request);
      if (!job)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Job not found",
        });
      callback(null, { job });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async deleteJob(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const success = await jobRepo.delete(call.request.id);
      callback(null, { success });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async applyToJob(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const application = await appRepo.create(call.request);
      callback(null, { application });
    } catch (err: any) {
      if (err.code === "23505") {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: "Already applied to this job",
        });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async listApplicationsByJob(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const result = await appRepo.listByJob(call.request);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async listApplicationsByUser(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const result = await appRepo.listByUser(call.request);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main(): void {
  const server = new grpc.Server();
  server.addService(JobServiceService, handlers);

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
      logger.info({ port }, "Job service running");
    },
  );

  gracefulShutdown(server, db, logger);
}

main();
