import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers/index";
import { config } from "./config";
import { connectNats } from "../../shared/src/events";
import { createLogger } from "../../shared/src/logger";
import type { AuthUser, GraphQLContext } from "./types";

const logger = createLogger("graphql-bff");

async function main(): Promise<void> {
  await connectNats("graphql-bff");

  const app = express();

  const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });
  await server.start();

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const token = req.headers.authorization?.replace("Bearer ", "");
        let user: AuthUser | null = null;
        if (token) {
          try {
            user = jwt.verify(token, config.jwtSecret) as AuthUser;
          } catch {
            // Invalid token — proceed as unauthenticated
          }
        }
        return { user };
      },
    }),
  );

  app.listen(config.port, () => {
    logger.info({ port: config.port }, "GraphQL BFF running");
  });
}

main().catch(console.error);
