// Re-export all generated types from protoc + ts-proto
export type {
  User,
  CreateUserRequest,
  GetUserRequest,
  GetUserByEmailRequest,
  ListUsersRequest,
  ListUsersResponse,
  UpdateUserRequest,
  DeleteUserRequest,
  DeleteUserResponse,
  UserResponse,
  LoginRequest,
  LoginResponse,
  UserServiceServer,
} from "../proto-generated/user";

export { UserServiceService, UserServiceClient } from "../proto-generated/user";

// ── Custom Types (not in proto) ──

export type UserRole = "TALENT_HUNTER" | "JOB_HUNTER";

// ── Promisified Client (for BFF circuit-breaker wrapper) ──

import type {
  CreateUserRequest,
  UserResponse,
  GetUserRequest,
  GetUserByEmailRequest,
  ListUsersRequest,
  ListUsersResponse,
  UpdateUserRequest,
  DeleteUserRequest,
  DeleteUserResponse,
  LoginRequest,
  LoginResponse,
} from "../proto-generated/user";

export interface UserServicePromiseClient {
  createUser(request: CreateUserRequest): Promise<UserResponse>;
  getUser(request: GetUserRequest): Promise<UserResponse>;
  getUserByEmail(request: GetUserByEmailRequest): Promise<UserResponse>;
  listUsers(request: ListUsersRequest): Promise<ListUsersResponse>;
  updateUser(request: UpdateUserRequest): Promise<UserResponse>;
  deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse>;
  login(request: LoginRequest): Promise<LoginResponse>;
}
