import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import type pino from "pino";
import db from "./db";
import { config } from "./config";
import { JobRepository, ApplicationRepository } from "./repository";
import { createLogger } from "../../../shared/src/logger";
import { addHealthCheck } from "../../../shared/src/health";
import { gracefulShutdown } from "../../../shared/src/shutdown";
import { initTracing } from "../../../shared/src/tracing";

initTracing("job-service");
const logger: pino.Logger = createLogger("job-service");

const PROTO_PATH = path.join(__dirname, "../../../protos/job.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const jobProto = grpc.loadPackageDefinition(packageDefinition).job as any;

const jobRepo = new JobRepository(db);
const appRepo = new ApplicationRepository(db);

const handlers: grpc.UntypedServiceImplementation = {
  async CreateJob(
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

  async GetJob(
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

  async ListJobs(
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

  async ListJobsByCompany(
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

  async UpdateJob(
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

  async DeleteJob(
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

  async ApplyToJob(
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

  async ListApplicationsByJob(
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

  async ListApplicationsByUser(
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
  server.addService(jobProto.JobService.service, handlers);

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
