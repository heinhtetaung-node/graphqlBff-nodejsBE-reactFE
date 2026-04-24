FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY knexfile.js ./
COPY migrations ./migrations
COPY src ./src
CMD ["sh", "-c", "node src/migrate.js && node src/index.js"]
