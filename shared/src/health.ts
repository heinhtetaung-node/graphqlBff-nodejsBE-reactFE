import * as grpc from "@grpc/grpc-js";
import type pino from "pino";

const SERVING = "SERVING";
const NOT_SERVING = "NOT_SERVING";

export interface HealthController {
  setServing(): void;
  setNotServing(): void;
}

export function addHealthCheck(
  server: grpc.Server,
  logger: pino.Logger,
): HealthController {
  let status = NOT_SERVING;

  const healthHandlers: grpc.UntypedServiceImplementation = {
    Check(
      _call: grpc.ServerUnaryCall<unknown, unknown>,
      callback: grpc.sendUnaryData<unknown>,
    ) {
      callback(null, { status });
    },
    Watch(call: grpc.ServerWritableStream<unknown, unknown>) {
      call.write({ status });
    },
  };

  server.addService(
    {
      Check: {
        path: "/grpc.health.v1.Health/Check",
        requestStream: false,
        responseStream: false,
        requestSerialize: (val: unknown) => Buffer.from(JSON.stringify(val)),
        requestDeserialize: (buf: Buffer) => JSON.parse(buf.toString()),
        responseSerialize: (val: unknown) => Buffer.from(JSON.stringify(val)),
        responseDeserialize: (buf: Buffer) => JSON.parse(buf.toString()),
      },
      Watch: {
        path: "/grpc.health.v1.Health/Watch",
        requestStream: false,
        responseStream: true,
        requestSerialize: (val: unknown) => Buffer.from(JSON.stringify(val)),
        requestDeserialize: (buf: Buffer) => JSON.parse(buf.toString()),
        responseSerialize: (val: unknown) => Buffer.from(JSON.stringify(val)),
        responseDeserialize: (buf: Buffer) => JSON.parse(buf.toString()),
      },
    },
    healthHandlers,
  );

  return {
    setServing() {
      status = SERVING;
      logger.info("Health status: SERVING");
    },
    setNotServing() {
      status = NOT_SERVING;
      logger.info("Health status: NOT_SERVING");
    },
  };
}
