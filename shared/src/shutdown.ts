import * as grpc from "@grpc/grpc-js";
import type { Knex } from "knex";
import type pino from "pino";

export function gracefulShutdown(
  server: grpc.Server,
  db: Knex,
  logger: pino.Logger,
): void {
  let isShuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(
      { signal },
      "Received shutdown signal, starting graceful shutdown...",
    );

    server.tryShutdown(async (err) => {
      if (err) {
        logger.error({ err }, "Error during gRPC server shutdown");
      } else {
        logger.info("gRPC server shut down gracefully");
      }

      try {
        await db.destroy();
        logger.info("Database connections closed");
      } catch (dbErr) {
        logger.error({ err: dbErr }, "Error closing database connections");
      }

      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
