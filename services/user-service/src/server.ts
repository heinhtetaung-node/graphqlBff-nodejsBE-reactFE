import * as grpc from '@grpc/grpc-js';
import type pino from 'pino';
import db from './db';
import { config } from './config';
import { UserRepository } from './repository';
import { createLogger } from '../../../shared/src/logger';
import { addHealthCheck } from '../../../shared/src/health';
import { gracefulShutdown } from '../../../shared/src/shutdown';
import { initTracing } from '../../../shared/src/tracing';
import {
  UserServiceService,
  type UserServiceServer,
} from '../../../shared/proto-generated/user';

initTracing('user-service');
const logger: pino.Logger = createLogger('user-service');

const userRepo = new UserRepository(db);

const handlers: UserServiceServer = {
  async createUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const { role } = call.request;
      if (!['TALENT_HUNTER', 'JOB_HUNTER'].includes(role)) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'Role must be TALENT_HUNTER or JOB_HUNTER' });
      }
      const user = await userRepo.create(call.request);
      callback(null, { user });
    } catch (err: any) {
      if (err.code === '23505') {
        return callback({ code: grpc.status.ALREADY_EXISTS, message: 'Email already registered' });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async getUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const user = await userRepo.findById(call.request.id);
      if (!user) return callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
      callback(null, { user });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async getUserByEmail(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const user = await userRepo.findByEmail(call.request.email);
      if (!user) return callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
      callback(null, { user });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async listUsers(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const result = await userRepo.list(call.request);
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async updateUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const user = await userRepo.update(call.request);
      if (!user) return callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
      callback(null, { user });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async deleteUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const success = await userRepo.delete(call.request.id);
      callback(null, { success });
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async login(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const { email, password } = call.request;
      const result = await userRepo.login(email, password);
      if (!result) {
        return callback({ code: grpc.status.UNAUTHENTICATED, message: 'Invalid credentials' });
      }
      callback(null, result);
    } catch (err: any) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main(): void {
  const server = new grpc.Server();
  server.addService(UserServiceService, handlers);

  const health = addHealthCheck(server, logger);
  const port = config.grpcPort;

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) {
        logger.fatal({ err }, 'Failed to bind server');
        process.exit(1);
      }
      health.setServing();
      logger.info({ port }, 'User service running');
    },
  );

  gracefulShutdown(server, db, logger);
}

main();
