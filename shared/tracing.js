const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const { Resource } = require("@opentelemetry/resources");
const { ATTR_SERVICE_NAME } = require("@opentelemetry/semantic-conventions");

function initTracing(serviceName) {
  const exporterUrl =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    "http://localhost:4318/v1/traces";

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: exporterUrl,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk.shutdown().catch(console.error);
  });

  return sdk;
}

module.exports = { initTracing };
