const {
  companyClient,
  jobClient,
  userClient,
  subscriptionClient,
} = require("./grpcClients");

function requireAuth(context) {
  if (!context.user) {
    throw new Error("Authentication required");
  }
  return context.user;
}

const resolvers = {
  Query: {
    // Companies
    async company(_, { id }) {
      const res = await companyClient.getCompany({ id });
      return res.company;
    },
    async companies(_, { page = 1, limit = 20, industry }) {
      return companyClient.listCompanies({ page, limit, industry });
    },

    // Jobs
    async job(_, { id }) {
      const res = await jobClient.getJob({ id });
      return res.job;
    },
    async jobs(
      _,
      { page = 1, limit = 20, jobType, experienceLevel, location },
    ) {
      return jobClient.listJobs({
        page,
        limit,
        jobType,
        experienceLevel,
        location,
      });
    },
    async jobsByCompany(_, { companyId, page = 1, limit = 20 }) {
      return jobClient.listJobsByCompany({ companyId, page, limit });
    },

    // Users
    async user(_, { id }) {
      const res = await userClient.getUser({ id });
      return res.user;
    },
    async users(_, { page = 1, limit = 20, role }) {
      return userClient.listUsers({ page, limit, role });
    },
    async me(_, __, context) {
      const auth = requireAuth(context);
      const res = await userClient.getUser({ id: auth.userId });
      return res.user;
    },

    // Applications
    async applicationsByJob(_, { jobId, page = 1, limit = 20 }) {
      return jobClient.listApplicationsByJob({ jobId, page, limit });
    },
    async applicationsByUser(_, { userId, page = 1, limit = 20 }) {
      return jobClient.listApplicationsByUser({ userId, page, limit });
    },
    async myApplications(_, { page = 1, limit = 20 }, context) {
      const auth = requireAuth(context);
      return jobClient.listApplicationsByUser({
        userId: auth.userId,
        page,
        limit,
      });
    },

    // Subscriptions
    async subscription(_, { id }) {
      const res = await subscriptionClient.getSubscription({ id });
      return res.subscription;
    },
    async mySubscription(_, __, context) {
      const auth = requireAuth(context);
      try {
        const res = await subscriptionClient.getSubscriptionByUser({
          userId: auth.userId,
        });
        return res.subscription;
      } catch (err) {
        if (err.code === 5) return null; // NOT_FOUND
        throw err;
      }
    },
    async checkUsageLimit(_, { actionType }, context) {
      const auth = requireAuth(context);
      return subscriptionClient.checkUsageLimit({
        userId: auth.userId,
        actionType,
      });
    },
    async myUsage(_, { actionType }, context) {
      const auth = requireAuth(context);
      const res = await subscriptionClient.getUsage({
        userId: auth.userId,
        actionType,
      });
      return res.usage;
    },
  },

  Mutation: {
    // Auth
    async register(_, args) {
      const res = await userClient.createUser(args);
      const loginRes = await userClient.login({
        email: args.email,
        password: args.password,
      });
      // Auto-assign free plan
      const plan =
        args.role === "TALENT_HUNTER"
          ? "TALENT_HUNTER_FREE"
          : "JOB_HUNTER_FREE";
      await subscriptionClient.createSubscription({
        userId: res.user.id,
        plan,
      });
      return loginRes;
    },
    async login(_, { email, password }) {
      return userClient.login({ email, password });
    },

    // Companies
    async createCompany(_, args, context) {
      requireAuth(context);
      const res = await companyClient.createCompany(args);
      return res.company;
    },
    async updateCompany(_, args, context) {
      requireAuth(context);
      const res = await companyClient.updateCompany(args);
      return res.company;
    },
    async deleteCompany(_, { id }, context) {
      requireAuth(context);
      const res = await companyClient.deleteCompany({ id });
      return res.success;
    },

    // Jobs (with usage limit check)
    async createJob(_, args, context) {
      const auth = requireAuth(context);
      // Check usage limit for talent hunters
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
      // Increment usage
      await subscriptionClient.incrementUsage({
        userId: auth.userId,
        actionType: "JOB_POST",
      });
      return res.job;
    },
    async updateJob(_, args, context) {
      requireAuth(context);
      const res = await jobClient.updateJob(args);
      return res.job;
    },
    async deleteJob(_, { id }, context) {
      requireAuth(context);
      const res = await jobClient.deleteJob({ id });
      return res.success;
    },

    // Applications (with usage limit check)
    async applyToJob(_, { jobId, coverLetter, resumeUrl }, context) {
      const auth = requireAuth(context);
      // Check usage limit for job hunters
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
      return res.application;
    },

    // Subscriptions
    async subscribe(_, { plan }, context) {
      const auth = requireAuth(context);
      const res = await subscriptionClient.createSubscription({
        userId: auth.userId,
        plan,
      });
      return res.subscription;
    },
    async cancelSubscription(_, { id }, context) {
      requireAuth(context);
      const res = await subscriptionClient.cancelSubscription({ id });
      return res.subscription;
    },
  },

  // Field resolvers for nested data
  Job: {
    async company(job) {
      try {
        const res = await companyClient.getCompany({ id: job.companyId });
        return res.company;
      } catch {
        return null;
      }
    },
  },

  User: {
    async company(user) {
      if (!user.companyId) return null;
      try {
        const res = await companyClient.getCompany({ id: user.companyId });
        return res.company;
      } catch {
        return null;
      }
    },
    async subscription(user) {
      try {
        const res = await subscriptionClient.getSubscriptionByUser({
          userId: user.id,
        });
        return res.subscription;
      } catch {
        return null;
      }
    },
  },

  Application: {
    async job(app) {
      try {
        const res = await jobClient.getJob({ id: app.jobId });
        return res.job;
      } catch {
        return null;
      }
    },
    async user(app) {
      try {
        const res = await userClient.getUser({ id: app.userId });
        return res.user;
      } catch {
        return null;
      }
    },
  },
};

module.exports = resolvers;
