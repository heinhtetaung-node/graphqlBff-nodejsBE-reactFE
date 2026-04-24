const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { wrapClientWithCircuitBreaker } = require("../../shared/circuitBreaker");

function loadClient(protoFile, packageName, serviceName, address) {
  const packageDefinition = protoLoader.loadSync(
    path.join(__dirname, "../../protos", protoFile),
    {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
  );
  const proto = grpc.loadPackageDefinition(packageDefinition)[packageName];
  return new proto[serviceName](address, grpc.credentials.createInsecure());
}

function promisify(client) {
  const wrapper = {};
  for (const method of Object.keys(Object.getPrototypeOf(client))) {
    if (typeof client[method] === "function" && method[0] !== "$") {
      wrapper[method] = (request) =>
        new Promise((resolve, reject) => {
          client[method](request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        });
    }
  }
  return wrapper;
}

const companyClient = wrapClientWithCircuitBreaker(
  promisify(
    loadClient(
      "company.proto",
      "company",
      "CompanyService",
      process.env.COMPANY_SERVICE_URL || "localhost:50051",
    ),
  ),
  "company-service",
);

const jobClient = wrapClientWithCircuitBreaker(
  promisify(
    loadClient(
      "job.proto",
      "job",
      "JobService",
      process.env.JOB_SERVICE_URL || "localhost:50052",
    ),
  ),
  "job-service",
);

const userClient = wrapClientWithCircuitBreaker(
  promisify(
    loadClient(
      "user.proto",
      "user",
      "UserService",
      process.env.USER_SERVICE_URL || "localhost:50053",
    ),
  ),
  "user-service",
);

const subscriptionClient = wrapClientWithCircuitBreaker(
  promisify(
    loadClient(
      "subscription.proto",
      "subscription",
      "SubscriptionService",
      process.env.SUBSCRIPTION_SERVICE_URL || "localhost:50054",
    ),
  ),
  "subscription-service",
);

module.exports = { companyClient, jobClient, userClient, subscriptionClient };
