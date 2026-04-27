export interface AuthUser {
  userId: string;
  role: string;
}

export interface GraphQLContext {
  user: AuthUser | null;
}
