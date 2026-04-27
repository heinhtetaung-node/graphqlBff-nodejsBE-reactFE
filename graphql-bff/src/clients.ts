import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { config } from "./config";
import { wrapClientWithCircuitBreaker } from "../../shared/src/circuitBreaker";
import type { CompanyServiceClient } from "../../shared/proto-types/company";
import type { JobServiceClient } from "../../shared/proto-types/job";
import type { UserServiceClient } from "../../shared/proto-types/user";
import type { SubscriptionServiceClient } from "../../shared/proto-types/subscription";

function loadClient(
  protoFile: string,
  packageName: string,
  serviceName: string,
  address: string,
): grpc.Client {
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
  const proto = grpc.loadPackageDefinition(packageDefinition)[
    packageName
  ] as any;
  return new proto[serviceName](address, grpc.credentials.createInsecure());
}

function promisify<T extends Record<string, (...args: any[]) => any>>(
  client: grpc.Client,
): T {
  const wrapper = {} as Record<string, (request: unknown) => Promise<unknown>>;
  for (const method of Object.keys(Object.getPrototypeOf(client))) {
    if (typeof (client as any)[method] === "function" && method[0] !== "$") {
      wrapper[method] = (request: unknown) =>
        new Promise((resolve, reject) => {
          (client as any)[method](
            request,
            (err: grpc.ServiceError | null, response: unknown) => {
              if (err) reject(err);
              else resolve(response);
            },
          );
        });
    }
  }
  return wrapper as unknown as T;
}

export const companyClient = wrapClientWithCircuitBreaker(
  promisify<CompanyServiceClient>(
    loadClient(
      "company.proto",
      "company",
      "CompanyService",
      config.companyServiceUrl,
    ),
  ),
  "company-service",
);

export const jobClient = wrapClientWithCircuitBreaker(
  promisify<JobServiceClient>(
    loadClient("job.proto", "job", "JobService", config.jobServiceUrl),
  ),
  "job-service",
);

export const userClient = wrapClientWithCircuitBreaker(
  promisify<UserServiceClient>(
    loadClient("user.proto", "user", "UserService", config.userServiceUrl),
  ),
  "user-service",
);

export const subscriptionClient = wrapClientWithCircuitBreaker(
  promisify<SubscriptionServiceClient>(
    loadClient(
      "subscription.proto",
      "subscription",
      "SubscriptionService",
      config.subscriptionServiceUrl,
    ),
  ),
  "subscription-service",
);
