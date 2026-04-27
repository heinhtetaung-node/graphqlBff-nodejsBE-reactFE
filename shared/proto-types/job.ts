// Re-export all generated types from protoc + ts-proto
export type {
  Job,
  Application,
  CreateJobRequest,
  GetJobRequest,
  ListJobsRequest,
  ListJobsByCompanyRequest,
  ListJobsResponse,
  UpdateJobRequest,
  DeleteJobRequest,
  DeleteJobResponse,
  JobResponse,
  ApplyToJobRequest,
  ApplicationResponse,
  ListApplicationsByJobRequest,
  ListApplicationsByUserRequest,
  ListApplicationsResponse,
  JobServiceServer,
} from "../proto-generated/job";

export { JobServiceService, JobServiceClient } from "../proto-generated/job";

// ── Promisified Client (for BFF circuit-breaker wrapper) ──

import type {
  CreateJobRequest,
  JobResponse,
  GetJobRequest,
  ListJobsRequest,
  ListJobsByCompanyRequest,
  ListJobsResponse,
  UpdateJobRequest,
  DeleteJobRequest,
  DeleteJobResponse,
  ApplyToJobRequest,
  ApplicationResponse,
  ListApplicationsByJobRequest,
  ListApplicationsByUserRequest,
  ListApplicationsResponse,
} from "../proto-generated/job";

export interface JobServicePromiseClient {
  createJob(request: CreateJobRequest): Promise<JobResponse>;
  getJob(request: GetJobRequest): Promise<JobResponse>;
  listJobs(request: ListJobsRequest): Promise<ListJobsResponse>;
  updateJob(request: UpdateJobRequest): Promise<JobResponse>;
  deleteJob(request: DeleteJobRequest): Promise<DeleteJobResponse>;
  listJobsByCompany(request: ListJobsByCompanyRequest): Promise<ListJobsResponse>;
  applyToJob(request: ApplyToJobRequest): Promise<ApplicationResponse>;
  listApplicationsByJob(request: ListApplicationsByJobRequest): Promise<ListApplicationsResponse>;
  listApplicationsByUser(request: ListApplicationsByUserRequest): Promise<ListApplicationsResponse>;
}
