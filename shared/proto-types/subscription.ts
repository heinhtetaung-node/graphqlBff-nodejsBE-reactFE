// Re-export all generated types from protoc + ts-proto
export type {
  Subscription,
  Usage,
  CreateSubscriptionRequest,
  GetSubscriptionRequest,
  GetSubscriptionByUserRequest,
  CancelSubscriptionRequest,
  SubscriptionResponse,
  CheckUsageLimitRequest,
  CheckUsageLimitResponse,
  IncrementUsageRequest,
  UsageResponse,
  GetUsageRequest,
  SubscriptionServiceServer,
} from "../proto-generated/subscription";

export { SubscriptionServiceService, SubscriptionServiceClient } from "../proto-generated/subscription";

// ── Custom Types (not in proto) ──

export type SubscriptionPlan =
  | "TALENT_HUNTER_FREE"
  | "TALENT_HUNTER_PRO"
  | "JOB_HUNTER_FREE"
  | "JOB_HUNTER_PRO";

export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";
export type ActionType = "JOB_POST" | "JOB_APPLY";

// ── Promisified Client (for BFF circuit-breaker wrapper) ──

import type {
  CreateSubscriptionRequest,
  SubscriptionResponse,
  GetSubscriptionRequest,
  GetSubscriptionByUserRequest,
  CancelSubscriptionRequest,
  CheckUsageLimitRequest,
  CheckUsageLimitResponse,
  IncrementUsageRequest,
  UsageResponse,
  GetUsageRequest,
} from "../proto-generated/subscription";

export interface SubscriptionServicePromiseClient {
  createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionResponse>;
  getSubscription(request: GetSubscriptionRequest): Promise<SubscriptionResponse>;
  getSubscriptionByUser(request: GetSubscriptionByUserRequest): Promise<SubscriptionResponse>;
  cancelSubscription(request: CancelSubscriptionRequest): Promise<SubscriptionResponse>;
  checkUsageLimit(request: CheckUsageLimitRequest): Promise<CheckUsageLimitResponse>;
  incrementUsage(request: IncrementUsageRequest): Promise<UsageResponse>;
  getUsage(request: GetUsageRequest): Promise<UsageResponse>;
}
