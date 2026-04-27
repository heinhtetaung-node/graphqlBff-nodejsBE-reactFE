import * as grpc from "@grpc/grpc-js";
import type pino from "pino";
import db from "./db";
import { config } from "./config";
import { CompanyRepository, ReviewRepository, InterviewExperienceRepository } from "./repository";
import { createLogger } from "../../../shared/src/logger";
import { addHealthCheck } from "../../../shared/src/health";
import { gracefulShutdown } from "../../../shared/src/shutdown";
import { initTracing } from "../../../shared/src/tracing";
import {
  CompanyServiceService,
  type CompanyServiceServer,
} from "../../../shared/proto-generated/company";

initTracing("company-service");
const logger: pino.Logger = createLogger("company-service");

const companyRepo = new CompanyRepository(db);
const reviewRepo = new ReviewRepository(db);
const interviewExpRepo = new InterviewExperienceRepository(db);

const handlers: CompanyServiceServer = {
  async createCompany(
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

  async getCompany(
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

  async listCompanies(
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

  async updateCompany(
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

  async deleteCompany(
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

  async createReview(
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

  async listReviews(
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

  async createInterviewExperience(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const { difficulty } = call.request;
      if (difficulty < 1 || difficulty > 5) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Difficulty must be between 1 and 5",
        });
      }
      const interviewExperience = await interviewExpRepo.create(call.request);
      callback(null, { interviewExperience });
    } catch (err: any) {
      if (err.constraint === "interview_experiences_company_id_user_id_position_title_unique") {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: "You have already shared an interview experience for this position at this company",
        });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async listInterviewExperiences(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    try {
      const result = await interviewExpRepo.list(call.request);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main(): void {
  const server = new grpc.Server();
  server.addService(CompanyServiceService, handlers);

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
