export const config = {
  grpcPort: process.env.GRPC_PORT || '50053',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'user_db',
  },
} as const;
