import {
  companyClient,
  jobClient,
  userClient,
  subscriptionClient,
} from "../clients";
import { requireAuth, requireRole, requireOwner } from "../auth";
import {
  validateUUID,
  validateEmail,
  validateString,
  validateEnum,
} from "../../../shared/src/validation";
import { publish } from "../../../shared/src/events";
import { eventSubjects } from "../../../shared/src/eventSubjects";
import type { GraphQLContext } from "../types";

export const mutationResolvers = {
  async register(_: unknown, args: any) {
    validateEmail(args.email);
    validateString(args.password, "password", { minLength: 6, maxLength: 128 });
    validateString(args.name, "name", { minLength: 1, maxLength: 100 });
    validateEnum(args.role, "role", ["TALENT_HUNTER", "JOB_HUNTER"]);

    const res = await userClient.createUser(args);
    const loginRes = await userClient.login({
      email: args.email,
      password: args.password,
    });

    const plan =
      args.role === "TALENT_HUNTER" ? "TALENT_HUNTER_FREE" : "JOB_HUNTER_FREE";
    await subscriptionClient.createSubscription({ userId: res.user.id, plan });

    publish(eventSubjects.USER_REGISTERED, {
      userId: res.user.id,
      role: args.role,
    });
    return loginRes;
  },

  async login(
    _: unknown,
    { email, password }: { email: string; password: string },
  ) {
    return userClient.login({ email, password });
  },

  async createReview(
    _: unknown,
    {
      companyId,
      rating,
      comment,
      positionTitle,
    }: {
      companyId: string;
      rating: number;
      comment?: string;
      positionTitle?: string;
    },
    context: GraphQLContext,
  ) {
    const auth = requireRole(context, "JOB_HUNTER");
    if (rating < 1 || rating > 5)
      throw new Error("Rating must be between 1 and 5");
    const res = await companyClient.createReview({
      companyId,
      userId: auth.userId,
      rating,
      comment,
      positionTitle,
    });
    return res.review;
  },

  async createCompany(_: unknown, args: any, context: GraphQLContext) {
    const auth = requireRole(context, "TALENT_HUNTER");
    validateString(args.name, "company name", { minLength: 1, maxLength: 200 });
    const res = await companyClient.createCompany(args);
    await userClient.updateUser({ id: auth.userId, companyId: res.company.id });
    publish(eventSubjects.COMPANY_CREATED, { company: res.company });
    return res.company;
  },

  async updateCompany(_: unknown, args: any, context: GraphQLContext) {
    const auth = requireRole(context, "TALENT_HUNTER");
    const userRes = await userClient.getUser({ id: auth.userId });
    if (userRes.user.companyId !== args.id)
      throw new Error("Forbidden: you can only update your own company");
    const res = await companyClient.updateCompany(args);
    return res.company;
  },

  async deleteCompany(
    _: unknown,
    { id }: { id: string },
    context: GraphQLContext,
  ) {
    const auth = requireRole(context, "TALENT_HUNTER");
    const userRes = await userClient.getUser({ id: auth.userId });
    if (userRes.user.companyId !== id)
      throw new Error("Forbidden: you can only delete your own company");
    const res = await companyClient.deleteCompany({ id });
    return res.success;
  },

  async createJob(_: unknown, args: any, context: GraphQLContext) {
    const auth = requireRole(context, "TALENT_HUNTER");
    validateUUID(args.companyId, "companyId");
    validateString(args.title, "title", { minLength: 3, maxLength: 200 });
    if (args.jobType)
      validateEnum(args.jobType, "jobType", [
        "FULL_TIME",
        "PART_TIME",
        "CONTRACT",
        "REMOTE",
      ]);
    if (args.experienceLevel)
      validateEnum(args.experienceLevel, "experienceLevel", [
        "JUNIOR",
        "MID",
        "SENIOR",
        "LEAD",
      ]);

    const limitCheck = await subscriptionClient.checkUsageLimit({
      userId: auth.userId,
      actionType: "JOB_POST",
    });
    if (!limitCheck.allowed) {
      throw new Error(
        `Job posting limit reached (${limitCheck.usedCount}/${limitCheck.maxCount}). Upgrade to Pro for unlimited posts.`,
      );
    }

    const res = await jobClient.createJob({
      ...args,
      postedByUserId: auth.userId,
    });
    await subscriptionClient.incrementUsage({
      userId: auth.userId,
      actionType: "JOB_POST",
    });
    publish(eventSubjects.JOB_CREATED, { job: res.job });
    return res.job;
  },

  async updateJob(_: unknown, args: any, context: GraphQLContext) {
    const auth = requireRole(context, "TALENT_HUNTER");
    const existing = await jobClient.getJob({ id: args.id });
    requireOwner(auth, existing.job.postedByUserId);
    const res = await jobClient.updateJob(args);
    return res.job;
  },

  async deleteJob(_: unknown, { id }: { id: string }, context: GraphQLContext) {
    const auth = requireRole(context, "TALENT_HUNTER");
    const existing = await jobClient.getJob({ id });
    requireOwner(auth, existing.job.postedByUserId);
    const res = await jobClient.deleteJob({ id });
    return res.success;
  },

  async applyToJob(
    _: unknown,
    {
      jobId,
      coverLetter,
      resumeUrl,
    }: { jobId: string; coverLetter?: string; resumeUrl?: string },
    context: GraphQLContext,
  ) {
    const auth = requireRole(context, "JOB_HUNTER");
    const limitCheck = await subscriptionClient.checkUsageLimit({
      userId: auth.userId,
      actionType: "JOB_APPLY",
    });
    if (!limitCheck.allowed) {
      throw new Error(
        `Application limit reached (${limitCheck.usedCount}/${limitCheck.maxCount}). Upgrade to Pro for unlimited applies.`,
      );
    }
    const res = await jobClient.applyToJob({
      jobId,
      userId: auth.userId,
      coverLetter,
      resumeUrl,
    });
    await subscriptionClient.incrementUsage({
      userId: auth.userId,
      actionType: "JOB_APPLY",
    });
    publish(eventSubjects.APPLICATION_SUBMITTED, {
      application: res.application,
    });
    return res.application;
  },

  async subscribe(
    _: unknown,
    { plan }: { plan: string },
    context: GraphQLContext,
  ) {
    const auth = requireAuth(context);
    validateEnum(plan, "plan", [
      "TALENT_HUNTER_FREE",
      "TALENT_HUNTER_PRO",
      "JOB_HUNTER_FREE",
      "JOB_HUNTER_PRO",
    ]);
    const res = await subscriptionClient.createSubscription({
      userId: auth.userId,
      plan,
    });
    return res.subscription;
  },

  async cancelSubscription(
    _: unknown,
    { id }: { id: string },
    context: GraphQLContext,
  ) {
    requireAuth(context);
    const res = await subscriptionClient.cancelSubscription({ id });
    return res.subscription;
  },
};
