const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

async function main() {
  const app = express();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

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
    console.log(`GraphQL BFF running at http://localhost:${port}/graphql`);
  });
}

main().catch(console.error);
