import {
  companyClient,
  jobClient,
  userClient,
  subscriptionClient,
} from "../clients";

export const fieldResolvers = {
  Job: {
    async company(job: { companyId: string }) {
      try {
        const res = await companyClient.getCompany({ id: job.companyId });
        return res.company;
      } catch {
        return null;
      }
    },
  },

  User: {
    async company(user: { companyId?: string }) {
      if (!user.companyId) return null;
      try {
        const res = await companyClient.getCompany({ id: user.companyId });
        return res.company;
      } catch {
        return null;
      }
    },
    async subscription(user: { id: string }) {
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
    async job(app: { jobId: string }) {
      try {
        const res = await jobClient.getJob({ id: app.jobId });
        return res.job;
      } catch {
        return null;
      }
    },
    async user(app: { userId: string }) {
      try {
        const res = await userClient.getUser({ id: app.userId });
        return res.user;
      } catch {
        return null;
      }
    },
  },

  Company: {
    async reviews(company: { id: string }) {
      try {
        return companyClient.listReviews({
          companyId: company.id,
          page: 1,
          limit: 10,
        });
      } catch {
        return { reviews: [], total: 0, averageRating: 0 };
      }
    },
    async averageRating(company: { id: string }) {
      try {
        const res = await companyClient.listReviews({
          companyId: company.id,
          page: 1,
          limit: 1,
        });
        return res.averageRating || 0;
      } catch {
        return 0;
      }
    },
  },

  Review: {},
};
