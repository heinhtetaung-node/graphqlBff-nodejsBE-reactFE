import { queryResolvers } from "./queries";
import { mutationResolvers } from "./mutations";
import { fieldResolvers } from "./fields";

export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  ...fieldResolvers,
};
