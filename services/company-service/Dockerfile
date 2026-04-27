FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY knexfile.js ./
COPY knexfile.ts ./
COPY tsconfig.json ./
COPY migrations ./migrations
COPY src ./src
CMD ["sh", "-c", "npx tsx src/migrate.ts && npx tsx src/server.ts"]
