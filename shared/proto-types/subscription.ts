import type * as grpc from "@grpc/grpc-js";

// ── Plan Types ──

export type SubscriptionPlan =
  | "TALENT_HUNTER_FREE"
  | "TALENT_HUNTER_PRO"
  | "JOB_HUNTER_FREE"
  | "JOB_HUNTER_PRO";

export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";
export type ActionType = "JOB_POST" | "JOB_APPLY";

// ── Messages ──

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  price: number;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Usage {
  id: string;
  userId: string;
  actionType: ActionType;
  usedCount: number;
  maxCount: number;
  periodStart: string;
  periodEnd: string;
}

export interface CreateSubscriptionRequest {
  userId: string;
  plan: string;
}

export interface GetSubscriptionRequest {
  id: string;
}

export interface GetSubscriptionByUserRequest {
  userId: string;
}

export interface CancelSubscriptionRequest {
  id: string;
}

export interface SubscriptionResponse {
  subscription: Subscription;
}

export interface CheckUsageLimitRequest {
  userId: string;
  actionType: string;
}

export interface CheckUsageLimitResponse {
  allowed: boolean;
  usedCount: number;
  maxCount: number;
}

export interface IncrementUsageRequest {
  userId: string;
  actionType: string;
}

export interface UsageResponse {
  usage: Usage;
}

export interface GetUsageRequest {
  userId: string;
  actionType: string;
}

// ── Server Handlers ──

export interface SubscriptionServiceHandlers {
  CreateSubscription: grpc.handleUnaryCall<
    CreateSubscriptionRequest,
    SubscriptionResponse
  >;
  GetSubscription: grpc.handleUnaryCall<
    GetSubscriptionRequest,
    SubscriptionResponse
  >;
  GetSubscriptionByUser: grpc.handleUnaryCall<
    GetSubscriptionByUserRequest,
    SubscriptionResponse
  >;
  CancelSubscription: grpc.handleUnaryCall<
    CancelSubscriptionRequest,
    SubscriptionResponse
  >;
  CheckUsageLimit: grpc.handleUnaryCall<
    CheckUsageLimitRequest,
    CheckUsageLimitResponse
  >;
  IncrementUsage: grpc.handleUnaryCall<IncrementUsageRequest, UsageResponse>;
  GetUsage: grpc.handleUnaryCall<GetUsageRequest, UsageResponse>;
}

// ── Promisified Client ──

export interface SubscriptionServiceClient {
  createSubscription(
    request: CreateSubscriptionRequest,
  ): Promise<SubscriptionResponse>;
  getSubscription(
    request: GetSubscriptionRequest,
  ): Promise<SubscriptionResponse>;
  getSubscriptionByUser(
    request: GetSubscriptionByUserRequest,
  ): Promise<SubscriptionResponse>;
  cancelSubscription(
    request: CancelSubscriptionRequest,
  ): Promise<SubscriptionResponse>;
  checkUsageLimit(
    request: CheckUsageLimitRequest,
  ): Promise<CheckUsageLimitResponse>;
  incrementUsage(request: IncrementUsageRequest): Promise<UsageResponse>;
  getUsage(request: GetUsageRequest): Promise<UsageResponse>;
}
