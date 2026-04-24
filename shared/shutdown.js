function gracefulShutdown(server, db, logger) {
  let isShuttingDown = false;

  async function shutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(
      { signal },
      "Received shutdown signal, starting graceful shutdown...",
    );

    // Stop accepting new connections
    server.tryShutdown(async (err) => {
      if (err) {
        logger.error({ err }, "Error during gRPC server shutdown");
      } else {
        logger.info("gRPC server shut down gracefully");
      }

      // Close database connections
      try {
        await db.destroy();
        logger.info("Database connections closed");
      } catch (dbErr) {
        logger.error({ err: dbErr }, "Error closing database connections");
      }

      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error("Graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, 10000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

module.exports = { gracefulShutdown };
