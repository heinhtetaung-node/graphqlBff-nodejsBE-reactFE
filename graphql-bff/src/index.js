const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const { connectNats } = require("../../shared/events");
const { createLogger } = require("../../shared/logger");

const logger = createLogger("graphql-bff");
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

async function main() {
  // Connect to NATS (non-blocking — works without it)
  await connectNats("graphql-bff");

  const app = express();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  // Health check endpoint
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.replace("Bearer ", "");
        let user = null;
        if (token) {
          try {
            user = jwt.verify(token, JWT_SECRET);
          } catch {
            // Invalid token — proceed as unauthenticated
          }
        }
        return { user };
      },
    }),
  );

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info({ port }, "GraphQL BFF running");
  });
}

main().catch(console.error);
