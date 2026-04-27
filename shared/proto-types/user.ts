import type * as grpc from "@grpc/grpc-js";

// ── Messages ──

export type UserRole = "TALENT_HUNTER" | "JOB_HUNTER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  avatarUrl: string;
  bio: string;
  companyId: string;
  skills: string[];
  resumeUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  bio?: string;
  companyId?: string;
  skills?: string[];
}

export interface GetUserRequest {
  id: string;
}

export interface GetUserByEmailRequest {
  email: string;
}

export interface ListUsersRequest {
  page?: number;
  limit?: number;
  role?: string;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  companyId?: string;
  skills?: string[];
  resumeUrl?: string;
}

export interface DeleteUserRequest {
  id: string;
}

export interface DeleteUserResponse {
  success: boolean;
}

export interface UserResponse {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ── Server Handlers ──

export interface UserServiceHandlers {
  CreateUser: grpc.handleUnaryCall<CreateUserRequest, UserResponse>;
  GetUser: grpc.handleUnaryCall<GetUserRequest, UserResponse>;
  GetUserByEmail: grpc.handleUnaryCall<GetUserByEmailRequest, UserResponse>;
  ListUsers: grpc.handleUnaryCall<ListUsersRequest, ListUsersResponse>;
  UpdateUser: grpc.handleUnaryCall<UpdateUserRequest, UserResponse>;
  DeleteUser: grpc.handleUnaryCall<DeleteUserRequest, DeleteUserResponse>;
  Login: grpc.handleUnaryCall<LoginRequest, LoginResponse>;
}

// ── Promisified Client ──

export interface UserServiceClient {
  createUser(request: CreateUserRequest): Promise<UserResponse>;
  getUser(request: GetUserRequest): Promise<UserResponse>;
  getUserByEmail(request: GetUserByEmailRequest): Promise<UserResponse>;
  listUsers(request: ListUsersRequest): Promise<ListUsersResponse>;
  updateUser(request: UpdateUserRequest): Promise<UserResponse>;
  deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse>;
  login(request: LoginRequest): Promise<LoginResponse>;
}
