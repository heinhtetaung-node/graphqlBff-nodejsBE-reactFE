import {
  companyClient,
  jobClient,
  userClient,
  subscriptionClient,
} from "../clients";
import { requireAuth, requireRole, requireOwner } from "../auth";
import type { GraphQLContext } from "../types";

export const queryResolvers = {
  async company(_: unknown, { id }: { id: string }) {
    const res = await companyClient.getCompany({ id });
    return res.company;
  },

  async companies(
    _: unknown,
    {
      page = 1,
      limit = 20,
      industry,
    }: { page?: number; limit?: number; industry?: string },
  ) {
    return companyClient.listCompanies({ page, limit, industry });
  },

  async reviews(
    _: unknown,
    {
      companyId,
      page = 1,
      limit = 20,
    }: { companyId: string; page?: number; limit?: number },
  ) {
    return companyClient.listReviews({ companyId, page, limit });
  },

  async job(_: unknown, { id }: { id: string }) {
    const res = await jobClient.getJob({ id });
    return res.job;
  },

  async jobs(
    _: unknown,
    {
      page = 1,
      limit = 20,
      jobType,
      experienceLevel,
      location,
      companyId,
    }: {
      page?: number;
      limit?: number;
      jobType?: string;
      experienceLevel?: string;
      location?: string;
      companyId?: string;
    },
  ) {
    return jobClient.listJobs({
      page,
      limit,
      jobType,
      experienceLevel,
      location,
      companyId,
    });
  },

  async jobsByCompany(
    _: unknown,
    {
      companyId,
      page = 1,
      limit = 20,
    }: { companyId: string; page?: number; limit?: number },
  ) {
    return jobClient.listJobsByCompany({ companyId, page, limit });
  },

  async myJobs(
    _: unknown,
    { page = 1, limit = 20 }: { page?: number; limit?: number },
    context: GraphQLContext,
  ) {
    const auth = requireAuth(context);
    requireRole(context, "TALENT_HUNTER");
    return jobClient.listJobs({ page, limit, postedByUserId: auth.userId });
  },

  async user(_: unknown, { id }: { id: string }) {
    const res = await userClient.getUser({ id });
    return res.user;
  },

  async users(
    _: unknown,
    {
      page = 1,
      limit = 20,
      role,
    }: { page?: number; limit?: number; role?: string },
  ) {
    return userClient.listUsers({ page, limit, role });
  },

  async me(_: unknown, __: unknown, context: GraphQLContext) {
    const auth = requireAuth(context);
    const res = await userClient.getUser({ id: auth.userId });
    return res.user;
  },

  async applicationsByJob(
    _: unknown,
    {
      jobId,
      page = 1,
      limit = 20,
    }: { jobId: string; page?: number; limit?: number },
    context: GraphQLContext,
  ) {
    const auth = requireRole(context, "TALENT_HUNTER");
    const jobRes = await jobClient.getJob({ id: jobId });
    requireOwner(auth, jobRes.job.postedByUserId);
    return jobClient.listApplicationsByJob({ jobId, page, limit });
  },

  async applicationsByUser(
    _: unknown,
    {
      userId,
      page = 1,
      limit = 20,
    }: { userId: string; page?: number; limit?: number },
    context: GraphQLContext,
  ) {
    const auth = requireAuth(context);
    requireOwner(auth, userId);
    return jobClient.listApplicationsByUser({ userId, page, limit });
  },

  async myApplications(
    _: unknown,
    { page = 1, limit = 20 }: { page?: number; limit?: number },
    context: GraphQLContext,
  ) {
    const auth = requireAuth(context);
    return jobClient.listApplicationsByUser({
      userId: auth.userId,
      page,
      limit,
    });
  },

  async subscription(_: unknown, { id }: { id: string }) {
    const res = await subscriptionClient.getSubscription({ id });
    return res.subscription;
  },

  async mySubscription(_: unknown, __: unknown, context: GraphQLContext) {
    const auth = requireAuth(context);
    try {
      const res = await subscriptionClient.getSubscriptionByUser({
        userId: auth.userId,
      });
      return res.subscription;
    } catch (err: any) {
      if (err.code === 5) return null;
      throw err;
    }
  },

  async checkUsageLimit(
    _: unknown,
    { actionType }: { actionType: string },
    context: GraphQLContext,
  ) {
    const auth = requireAuth(context);
    return subscriptionClient.checkUsageLimit({
      userId: auth.userId,
      actionType,
    });
  },

  async myUsage(
    _: unknown,
    { actionType }: { actionType: string },
    context: GraphQLContext,
  ) {
    const auth = requireAuth(context);
    const res = await subscriptionClient.getUsage({
      userId: auth.userId,
      actionType,
    });
    return res.usage;
  },
};
