const { initTracing } = require("../../../shared/tracing");
initTracing(process.env.SERVICE_NAME || "job-service");
