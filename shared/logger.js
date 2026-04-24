const pino = require("pino");

function createLogger(serviceName) {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || "info",
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(process.env.NODE_ENV !== "production" && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    }),
  });
}

module.exports = { createLogger };
