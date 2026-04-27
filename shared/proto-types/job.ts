import type * as grpc from "@grpc/grpc-js";

// ── Messages ──

export interface Job {
  id: string;
  companyId: string;
  postedByUserId: string;
  title: string;
  description: string;
  location: string;
  salaryRange: string;
  jobType: string;
  experienceLevel: string;
  skills: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  coverLetter: string;
  resumeUrl: string;
  status: string;
  createdAt: string;
}

export interface CreateJobRequest {
  companyId: string;
  postedByUserId: string;
  title: string;
  description?: string;
  location?: string;
  salaryRange?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
}

export interface GetJobRequest {
  id: string;
}

export interface ListJobsRequest {
  page?: number;
  limit?: number;
  jobType?: string;
  experienceLevel?: string;
  location?: string;
  postedByUserId?: string;
  companyId?: string;
}

export interface ListJobsByCompanyRequest {
  companyId: string;
  page?: number;
  limit?: number;
}

export interface ListJobsResponse {
  jobs: Job[];
  total: number;
}

export interface UpdateJobRequest {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  salaryRange?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
  isActive?: boolean;
}

export interface DeleteJobRequest {
  id: string;
}

export interface DeleteJobResponse {
  success: boolean;
}

export interface JobResponse {
  job: Job;
}

export interface ApplyToJobRequest {
  jobId: string;
  userId: string;
  coverLetter?: string;
  resumeUrl?: string;
}

export interface ApplicationResponse {
  application: Application;
}

export interface ListApplicationsByJobRequest {
  jobId: string;
  page?: number;
  limit?: number;
}

export interface ListApplicationsByUserRequest {
  userId: string;
  page?: number;
  limit?: number;
}

export interface ListApplicationsResponse {
  applications: Application[];
  total: number;
}

// ── Server Handlers ──

export interface JobServiceHandlers {
  CreateJob: grpc.handleUnaryCall<CreateJobRequest, JobResponse>;
  GetJob: grpc.handleUnaryCall<GetJobRequest, JobResponse>;
  ListJobs: grpc.handleUnaryCall<ListJobsRequest, ListJobsResponse>;
  UpdateJob: grpc.handleUnaryCall<UpdateJobRequest, JobResponse>;
  DeleteJob: grpc.handleUnaryCall<DeleteJobRequest, DeleteJobResponse>;
  ListJobsByCompany: grpc.handleUnaryCall<
    ListJobsByCompanyRequest,
    ListJobsResponse
  >;
  ApplyToJob: grpc.handleUnaryCall<ApplyToJobRequest, ApplicationResponse>;
  ListApplicationsByJob: grpc.handleUnaryCall<
    ListApplicationsByJobRequest,
    ListApplicationsResponse
  >;
  ListApplicationsByUser: grpc.handleUnaryCall<
    ListApplicationsByUserRequest,
    ListApplicationsResponse
  >;
}

// ── Promisified Client ──

export interface JobServiceClient {
  createJob(request: CreateJobRequest): Promise<JobResponse>;
  getJob(request: GetJobRequest): Promise<JobResponse>;
  listJobs(request: ListJobsRequest): Promise<ListJobsResponse>;
  updateJob(request: UpdateJobRequest): Promise<JobResponse>;
  deleteJob(request: DeleteJobRequest): Promise<DeleteJobResponse>;
  listJobsByCompany(
    request: ListJobsByCompanyRequest,
  ): Promise<ListJobsResponse>;
  applyToJob(request: ApplyToJobRequest): Promise<ApplicationResponse>;
  listApplicationsByJob(
    request: ListApplicationsByJobRequest,
  ): Promise<ListApplicationsResponse>;
  listApplicationsByUser(
    request: ListApplicationsByUserRequest,
  ): Promise<ListApplicationsResponse>;
}
