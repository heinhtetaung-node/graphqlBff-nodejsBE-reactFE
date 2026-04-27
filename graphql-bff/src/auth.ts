import type { AuthUser, GraphQLContext } from "./types";

export function requireAuth(context: GraphQLContext): AuthUser {
  if (!context.user) {
    throw new Error("Authentication required");
  }
  return context.user;
}

export function requireRole(
  context: GraphQLContext,
  ...roles: string[]
): AuthUser {
  const auth = requireAuth(context);
  if (!roles.includes(auth.role)) {
    throw new Error(`Forbidden: requires role ${roles.join(" or ")}`);
  }
  return auth;
}

export function requireOwner(auth: AuthUser, resourceUserId: string): void {
  if (auth.userId !== resourceUserId) {
    throw new Error("Forbidden: you do not own this resource");
  }
}
