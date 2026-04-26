const typeDefs = `#graphql
  type Company {
    id: ID!
    name: String!
    description: String
    website: String
    industry: String
    logoUrl: String
    location: String
    employeeCount: Int
    jobs: [Job!]
    reviews: PaginatedReviews
    averageRating: Float
    createdAt: String
    updatedAt: String
  }

  type Review {
    id: ID!
    companyId: ID!
    userId: ID!
    rating: Int!
    comment: String
    positionTitle: String
    createdAt: String
  }

  type PaginatedReviews {
    reviews: [Review!]!
    total: Int!
    averageRating: Float!
  }

  type Job {
    id: ID!
    companyId: ID!
    postedByUserId: ID!
    title: String!
    description: String
    location: String
    salaryRange: String
    jobType: String
    experienceLevel: String
    skills: [String!]
    isActive: Boolean
    company: Company
    applications: [Application!]
    createdAt: String
    updatedAt: String
  }

  type Application {
    id: ID!
    jobId: ID!
    userId: ID!
    coverLetter: String
    resumeUrl: String
    status: String
    job: Job
    user: User
    createdAt: String
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: String!
    phone: String
    avatarUrl: String
    bio: String
    companyId: String
    skills: [String!]
    resumeUrl: String
    company: Company
    subscription: Subscription
    createdAt: String
    updatedAt: String
  }

  type Subscription {
    id: ID!
    userId: ID!
    plan: String!
    price: Float!
    status: String!
    startsAt: String
    endsAt: String
    createdAt: String
    updatedAt: String
  }

  type Usage {
    id: ID!
    userId: ID!
    actionType: String!
    usedCount: Int!
    maxCount: Int!
    periodStart: String
    periodEnd: String
  }

  type UsageLimitCheck {
    allowed: Boolean!
    usedCount: Int!
    maxCount: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type PaginatedJobs {
    jobs: [Job!]!
    total: Int!
  }

  type PaginatedCompanies {
    companies: [Company!]!
    total: Int!
  }

  type PaginatedApplications {
    applications: [Application!]!
    total: Int!
  }

  type PaginatedUsers {
    users: [User!]!
    total: Int!
  }

  type Query {
    # Companies
    company(id: ID!): Company
    companies(page: Int, limit: Int, industry: String): PaginatedCompanies!

    # Reviews
    reviews(companyId: ID!, page: Int, limit: Int): PaginatedReviews!

    # Jobs
    job(id: ID!): Job
    jobs(page: Int, limit: Int, jobType: String, experienceLevel: String, location: String, companyId: ID): PaginatedJobs!
    jobsByCompany(companyId: ID!, page: Int, limit: Int): PaginatedJobs!
    myJobs(page: Int, limit: Int): PaginatedJobs!

    # Users
    user(id: ID!): User
    users(page: Int, limit: Int, role: String): PaginatedUsers!
    me: User

    # Applications
    applicationsByJob(jobId: ID!, page: Int, limit: Int): PaginatedApplications!
    applicationsByUser(userId: ID!, page: Int, limit: Int): PaginatedApplications!
    myApplications(page: Int, limit: Int): PaginatedApplications!

    # Subscriptions
    subscription(id: ID!): Subscription
    mySubscription: Subscription
    checkUsageLimit(actionType: String!): UsageLimitCheck!
    myUsage(actionType: String!): Usage
  }

  type Mutation {
    # Auth
    register(email: String!, password: String!, name: String!, role: String!, phone: String, bio: String, companyId: String, skills: [String!]): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Companies
    createCompany(name: String!, description: String, website: String, industry: String, logoUrl: String, location: String, employeeCount: Int): Company!
    updateCompany(id: ID!, name: String, description: String, website: String, industry: String, logoUrl: String, location: String, employeeCount: Int): Company!
    deleteCompany(id: ID!): Boolean!

    # Reviews
    createReview(companyId: ID!, rating: Int!, comment: String, positionTitle: String): Review!

    # Jobs
    createJob(companyId: ID!, title: String!, description: String, location: String, salaryRange: String, jobType: String, experienceLevel: String, skills: [String!]): Job!
    updateJob(id: ID!, title: String, description: String, location: String, salaryRange: String, jobType: String, experienceLevel: String, skills: [String!], isActive: Boolean): Job!
    deleteJob(id: ID!): Boolean!

    # Applications
    applyToJob(jobId: ID!, coverLetter: String, resumeUrl: String): Application!

    # Subscriptions
    subscribe(plan: String!): Subscription!
    cancelSubscription(id: ID!): Subscription!
  }
`;

module.exports = typeDefs;
