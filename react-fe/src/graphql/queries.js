import { gql } from "@apollo/client";

// Auth
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register(
    $email: String!
    $password: String!
    $name: String!
    $role: String!
    $phone: String
    $bio: String
    $companyId: String
    $skills: [String!]
  ) {
    register(
      email: $email
      password: $password
      name: $name
      role: $role
      phone: $phone
      bio: $bio
      companyId: $companyId
      skills: $skills
    ) {
      token
      user {
        id
        email
        name
        role
      }
    }
  }
`;

// Jobs
export const GET_JOBS = gql`
  query GetJobs(
    $page: Int
    $limit: Int
    $jobType: String
    $experienceLevel: String
    $location: String
    $companyId: ID
  ) {
    jobs(
      page: $page
      limit: $limit
      jobType: $jobType
      experienceLevel: $experienceLevel
      location: $location
      companyId: $companyId
    ) {
      jobs {
        id
        title
        location
        salaryRange
        jobType
        experienceLevel
        skills
        isActive
        createdAt
        company {
          id
          name
          logoUrl
        }
      }
      total
    }
  }
`;

export const GET_JOB = gql`
  query GetJob($id: ID!) {
    job(id: $id) {
      id
      title
      description
      location
      salaryRange
      jobType
      experienceLevel
      skills
      isActive
      createdAt
      company {
        id
        name
        description
        website
        location
        logoUrl
      }
    }
  }
`;

export const CREATE_JOB = gql`
  mutation CreateJob(
    $companyId: ID!
    $title: String!
    $description: String
    $location: String
    $salaryRange: String
    $jobType: String
    $experienceLevel: String
    $skills: [String!]
  ) {
    createJob(
      companyId: $companyId
      title: $title
      description: $description
      location: $location
      salaryRange: $salaryRange
      jobType: $jobType
      experienceLevel: $experienceLevel
      skills: $skills
    ) {
      id
      title
    }
  }
`;

// Applications
export const APPLY_TO_JOB = gql`
  mutation ApplyToJob($jobId: ID!, $coverLetter: String, $resumeUrl: String) {
    applyToJob(
      jobId: $jobId
      coverLetter: $coverLetter
      resumeUrl: $resumeUrl
    ) {
      id
      status
    }
  }
`;

export const MY_APPLICATIONS = gql`
  query MyApplications($page: Int, $limit: Int) {
    myApplications(page: $page, limit: $limit) {
      applications {
        id
        status
        coverLetter
        createdAt
        job {
          id
          title
          company {
            name
          }
        }
      }
      total
    }
  }
`;

export const MY_JOBS = gql`
  query MyJobs($page: Int, $limit: Int) {
    myJobs(page: $page, limit: $limit) {
      jobs {
        id
        title
        location
        salaryRange
        jobType
        experienceLevel
        isActive
        createdAt
        company {
          id
          name
        }
      }
      total
    }
  }
`;

export const APPLICATIONS_BY_JOB = gql`
  query ApplicationsByJob($jobId: ID!, $page: Int, $limit: Int) {
    applicationsByJob(jobId: $jobId, page: $page, limit: $limit) {
      applications {
        id
        userId
        status
        coverLetter
        resumeUrl
        createdAt
        user {
          name
        }
      }
      total
    }
  }
`;

// Companies
export const GET_COMPANIES = gql`
  query GetCompanies($page: Int, $limit: Int) {
    companies(page: $page, limit: $limit) {
      companies {
        id
        name
        description
        industry
        location
        employeeCount
        logoUrl
        averageRating
        reviews {
          total
        }
        interviewExperiences {
          total
        }
      }
      total
    }
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany(
    $name: String!
    $description: String
    $website: String
    $industry: String
    $location: String
    $employeeCount: Int
  ) {
    createCompany(
      name: $name
      description: $description
      website: $website
      industry: $industry
      location: $location
      employeeCount: $employeeCount
    ) {
      id
      name
    }
  }
`;

// Users / Profile
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      role
      phone
      bio
      companyId
      company {
        id
        name
      }
      skills
      resumeUrl
      subscription {
        id
        plan
        price
        status
      }
    }
  }
`;

// Subscriptions
export const SUBSCRIBE = gql`
  mutation Subscribe($plan: String!) {
    subscribe(plan: $plan) {
      id
      plan
      price
      status
    }
  }
`;

export const CHECK_USAGE = gql`
  query CheckUsage($actionType: String!) {
    checkUsageLimit(actionType: $actionType) {
      allowed
      usedCount
      maxCount
    }
  }
`;

export const MY_SUBSCRIPTION = gql`
  query MySubscription {
    mySubscription {
      id
      plan
      price
      status
      startsAt
      endsAt
    }
  }
`;

export const GET_REVIEWS = gql`
  query GetReviews($companyId: ID!, $page: Int, $limit: Int) {
    reviews(companyId: $companyId, page: $page, limit: $limit) {
      reviews {
        id
        companyId
        userId
        rating
        comment
        positionTitle
        createdAt
      }
      total
      averageRating
    }
  }
`;

export const CREATE_REVIEW = gql`
  mutation CreateReview(
    $companyId: ID!
    $rating: Int!
    $comment: String
    $positionTitle: String
  ) {
    createReview(
      companyId: $companyId
      rating: $rating
      comment: $comment
      positionTitle: $positionTitle
    ) {
      id
      rating
      comment
      positionTitle
      createdAt
    }
  }
`;

export const GET_INTERVIEW_EXPERIENCES = gql`
  query GetInterviewExperiences($companyId: ID!, $page: Int, $limit: Int) {
    interviewExperiences(companyId: $companyId, page: $page, limit: $limit) {
      interviewExperiences {
        id
        companyId
        userId
        positionTitle
        difficulty
        result
        description
        interviewDate
        createdAt
      }
      total
      averageDifficulty
    }
  }
`;

export const CREATE_INTERVIEW_EXPERIENCE = gql`
  mutation CreateInterviewExperience(
    $companyId: ID!
    $positionTitle: String!
    $difficulty: Int!
    $result: String
    $description: String
    $interviewDate: String
  ) {
    createInterviewExperience(
      companyId: $companyId
      positionTitle: $positionTitle
      difficulty: $difficulty
      result: $result
      description: $description
      interviewDate: $interviewDate
    ) {
      id
      positionTitle
      difficulty
      result
      description
      interviewDate
      createdAt
    }
  }
`;
