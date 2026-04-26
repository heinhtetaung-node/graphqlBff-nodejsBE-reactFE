const {
  companyClient,
  jobClient,
  userClient,
  subscriptionClient,
} = require("./grpcClients");
const {
  validateUUID,
  validateEmail,
  validateString,
  validateEnum,
  validatePagination,
} = require("../../shared/validation");
const { publish } = require("../../shared/events");
const subjects = require("../../shared/eventSubjects");

function requireAuth(context) {
  if (!context.user) {
    throw new Error("Authentication required");
  }
  return context.user;
}

function requireRole(context, ...roles) {
  const auth = requireAuth(context);
  if (!roles.includes(auth.role)) {
    throw new Error(`Forbidden: requires role ${roles.join(" or ")}`);
  }
  return auth;
}

function requireOwner(auth, resourceUserId) {
  if (auth.userId !== resourceUserId) {
    throw new Error("Forbidden: you do not own this resource");
  }
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

    // Reviews
    async reviews(_, { companyId, page = 1, limit = 20 }) {
      return companyClient.listReviews({ companyId, page, limit });
    },

    // Jobs
    async job(_, { id }) {
      const res = await jobClient.getJob({ id });
      return res.job;
    },
    async jobs(
      _,
      { page = 1, limit = 20, jobType, experienceLevel, location, companyId },
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
    async jobsByCompany(_, { companyId, page = 1, limit = 20 }) {
      return jobClient.listJobsByCompany({ companyId, page, limit });
    },
    async myJobs(_, { page = 1, limit = 20 }, context) {
      const auth = requireAuth(context);
      requireRole(context, "TALENT_HUNTER");
      return jobClient.listJobs({
        page,
        limit,
        postedByUserId: auth.userId,
      });
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

    // Applications — only the job poster can see applicants
    async applicationsByJob(_, { jobId, page = 1, limit = 20 }, context) {
      const auth = requireRole(context, "TALENT_HUNTER");
      const jobRes = await jobClient.getJob({ id: jobId });
      requireOwner(auth, jobRes.job.postedByUserId);
      return jobClient.listApplicationsByJob({ jobId, page, limit });
    },
    async applicationsByUser(_, { userId, page = 1, limit = 20 }, context) {
      const auth = requireAuth(context);
      requireOwner(auth, userId);
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
      validateEmail(args.email);
      validateString(args.password, "password", {
        minLength: 6,
        maxLength: 128,
      });
      validateString(args.name, "name", { minLength: 1, maxLength: 100 });
      validateEnum(args.role, "role", ["TALENT_HUNTER", "JOB_HUNTER"]);
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
      publish(subjects.USER_REGISTERED, {
        userId: res.user.id,
        role: args.role,
      });
      return loginRes;
    },
    async login(_, { email, password }) {
      return userClient.login({ email, password });
    },

    // Reviews — only JOB_HUNTERs can review
    async createReview(_, { companyId, rating, comment }, context) {
      const auth = requireRole(context, "JOB_HUNTER");
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }
      const res = await companyClient.createReview({
        companyId,
        userId: auth.userId,
        rating,
        comment,
      });
      return res.review;
    },

    // Companies — only TALENT_HUNTERs can manage companies
    async createCompany(_, args, context) {
      const auth = requireRole(context, "TALENT_HUNTER");
      validateString(args.name, "company name", {
        minLength: 1,
        maxLength: 200,
      });
      const res = await companyClient.createCompany(args);
      // Link the company to the user who created it
      await userClient.updateUser({
        id: auth.userId,
        companyId: res.company.id,
      });
      publish(subjects.COMPANY_CREATED, { company: res.company });
      return res.company;
    },
    async updateCompany(_, args, context) {
      const auth = requireRole(context, "TALENT_HUNTER");
      // Verify the user belongs to this company
      const userRes = await userClient.getUser({ id: auth.userId });
      if (userRes.user.companyId !== args.id) {
        throw new Error("Forbidden: you can only update your own company");
      }
      const res = await companyClient.updateCompany(args);
      return res.company;
    },
    async deleteCompany(_, { id }, context) {
      const auth = requireRole(context, "TALENT_HUNTER");
      const userRes = await userClient.getUser({ id: auth.userId });
      if (userRes.user.companyId !== id) {
        throw new Error("Forbidden: you can only delete your own company");
      }
      const res = await companyClient.deleteCompany({ id });
      return res.success;
    },

    // Jobs — only TALENT_HUNTERs can post/edit/delete
    async createJob(_, args, context) {
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
      publish(subjects.JOB_CREATED, { job: res.job });
      return res.job;
    },
    async updateJob(_, args, context) {
      const auth = requireRole(context, "TALENT_HUNTER");
      // Verify ownership
      const existing = await jobClient.getJob({ id: args.id });
      requireOwner(auth, existing.job.postedByUserId);
      const res = await jobClient.updateJob(args);
      return res.job;
    },
    async deleteJob(_, { id }, context) {
      const auth = requireRole(context, "TALENT_HUNTER");
      const existing = await jobClient.getJob({ id });
      requireOwner(auth, existing.job.postedByUserId);
      const res = await jobClient.deleteJob({ id });
      return res.success;
    },

    // Applications — only JOB_HUNTERs can apply
    async applyToJob(_, { jobId, coverLetter, resumeUrl }, context) {
      const auth = requireRole(context, "JOB_HUNTER");
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
      publish(subjects.APPLICATION_SUBMITTED, { application: res.application });
      return res.application;
    },

    // Subscriptions
    async subscribe(_, { plan }, context) {
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

  Company: {
    async reviews(company) {
      try {
        return companyClient.listReviews({ companyId: company.id, page: 1, limit: 10 });
      } catch {
        return { reviews: [], total: 0, averageRating: 0 };
      }
    },
    async averageRating(company) {
      try {
        const res = await companyClient.listReviews({ companyId: company.id, page: 1, limit: 1 });
        return res.averageRating || 0;
      } catch {
        return 0;
      }
    },
  },

  Review: {
    async user(review) {
      try {
        const res = await userClient.getUser({ id: review.userId });
        return res.user;
      } catch {
        return null;
      }
    },
  },
};

module.exports = resolvers;
