const grpc = require("@grpc/grpc-js");

const SERVING = "SERVING";
const NOT_SERVING = "NOT_SERVING";

function addHealthCheck(server, logger) {
  let status = NOT_SERVING;

  const healthHandlers = {
    Check(call, callback) {
      callback(null, { status });
    },
    Watch(call) {
      call.write({ status });
    },
  };

  // gRPC health check protocol (grpc.health.v1.Health)
  // We implement it manually to avoid proto dependency
  server.addService(
    {
      Check: {
        path: "/grpc.health.v1.Health/Check",
        requestStream: false,
        responseStream: false,
        requestSerialize: (val) => Buffer.from(JSON.stringify(val)),
        requestDeserialize: (buf) => JSON.parse(buf.toString()),
        responseSerialize: (val) => Buffer.from(JSON.stringify(val)),
        responseDeserialize: (buf) => JSON.parse(buf.toString()),
      },
      Watch: {
        path: "/grpc.health.v1.Health/Watch",
        requestStream: false,
        responseStream: true,
        requestSerialize: (val) => Buffer.from(JSON.stringify(val)),
        requestDeserialize: (buf) => JSON.parse(buf.toString()),
        responseSerialize: (val) => Buffer.from(JSON.stringify(val)),
        responseDeserialize: (buf) => JSON.parse(buf.toString()),
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

module.exports = { addHealthCheck };
