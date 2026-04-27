export const eventSubjects = {
  JOB_CREATED: "job.created",
  JOB_UPDATED: "job.updated",
  JOB_DELETED: "job.deleted",
  APPLICATION_SUBMITTED: "application.submitted",
  APPLICATION_STATUS_CHANGED: "application.status_changed",
  USER_REGISTERED: "user.registered",
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  COMPANY_CREATED: "company.created",
} as const;

export type EventSubject = (typeof eventSubjects)[keyof typeof eventSubjects];
