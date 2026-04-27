import * as grpc from "@grpc/grpc-js";
import { config } from "./config";
import { wrapClientWithCircuitBreaker } from "../../shared/src/circuitBreaker";
import { CompanyServiceService } from "../../shared/proto-generated/company";
import type { CompanyServicePromiseClient } from "../../shared/proto-types/company";
import { JobServiceService } from "../../shared/proto-generated/job";
import type { JobServicePromiseClient } from "../../shared/proto-types/job";
import { UserServiceService } from "../../shared/proto-generated/user";
import type { UserServicePromiseClient } from "../../shared/proto-types/user";
import { SubscriptionServiceService } from "../../shared/proto-generated/subscription";
import type { SubscriptionServicePromiseClient } from "../../shared/proto-types/subscription";

/**
 * Patch a service definition so that requestSerialize normalises
 * `undefined`/`null` values to proto3 defaults before encoding.
 *
 * ts-proto's encode() assumes every field is set to a typed value;
 * passing `undefined` (common for optional GraphQL args) crashes the
 * encoder.  We decode an empty buffer once per method to obtain the
 * canonical defaults, then merge them under the caller-supplied values
 * at serialisation time.
 */
function normalizeServiceDefinition(
  def: grpc.ServiceDefinition,
): grpc.ServiceDefinition {
  const patched: Record<string, unknown> = {};
  for (const [key, method] of Object.entries(def)) {
    const m = method as any;
    const origSerialize: (v: any) => Buffer = m.requestSerialize;
    const defaults: Record<string, unknown> = m.requestDeserialize(
      Buffer.from([]),
    );
    patched[key] = {
      ...m,
      requestSerialize: (value: any) => {
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
          if (v !== undefined && v !== null) {
            clean[k] = v;
          }
        }
        return origSerialize({ ...defaults, ...clean });
      },
    };
  }
  return patched as grpc.ServiceDefinition;
}

function createClient(
  serviceDefinition: grpc.ServiceDefinition,
  serviceName: string,
  address: string,
): grpc.Client {
  const normalizedDef = normalizeServiceDefinition(serviceDefinition);
  const ClientCtor = grpc.makeGenericClientConstructor(normalizedDef, serviceName);
  return new ClientCtor(address, grpc.credentials.createInsecure());
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
  promisify<CompanyServicePromiseClient>(
    createClient(
      CompanyServiceService as unknown as grpc.ServiceDefinition,
      "company.CompanyService",
      config.companyServiceUrl,
    ),
  ),
  "company-service",
);

export const jobClient = wrapClientWithCircuitBreaker(
  promisify<JobServicePromiseClient>(
    createClient(
      JobServiceService as unknown as grpc.ServiceDefinition,
      "job.JobService",
      config.jobServiceUrl,
    ),
  ),
  "job-service",
);

export const userClient = wrapClientWithCircuitBreaker(
  promisify<UserServicePromiseClient>(
    createClient(
      UserServiceService as unknown as grpc.ServiceDefinition,
      "user.UserService",
      config.userServiceUrl,
    ),
  ),
  "user-service",
);

export const subscriptionClient = wrapClientWithCircuitBreaker(
  promisify<SubscriptionServicePromiseClient>(
    createClient(
      SubscriptionServiceService as unknown as grpc.ServiceDefinition,
      "subscription.SubscriptionService",
      config.subscriptionServiceUrl,
    ),
  ),
  "subscription-service",
);
