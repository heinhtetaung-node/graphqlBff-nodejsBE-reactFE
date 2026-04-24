// Event subjects used across services
module.exports = {
  // Job events
  JOB_CREATED: "job.created",
  JOB_UPDATED: "job.updated",
  JOB_DELETED: "job.deleted",

  // Application events
  APPLICATION_SUBMITTED: "application.submitted",
  APPLICATION_STATUS_CHANGED: "application.status_changed",

  // User events
  USER_REGISTERED: "user.registered",

  // Subscription events
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",

  // Company events
  COMPANY_CREATED: "company.created",
};
