import pino from "pino";

export function createLogger(serviceName: string): pino.Logger {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || "info",
    formatters: {
      level(label: string) {
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
