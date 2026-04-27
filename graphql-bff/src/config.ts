export const config = {
  port: process.env.PORT || "4000",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  companyServiceUrl: process.env.COMPANY_SERVICE_URL || "localhost:50051",
  jobServiceUrl: process.env.JOB_SERVICE_URL || "localhost:50052",
  userServiceUrl: process.env.USER_SERVICE_URL || "localhost:50053",
  subscriptionServiceUrl:
    process.env.SUBSCRIPTION_SERVICE_URL || "localhost:50054",
  natsUrl: process.env.NATS_URL || "nats://localhost:4222",
} as const;
