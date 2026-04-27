// Re-export all generated types from protoc + ts-proto
export type {
  Company,
  CreateCompanyRequest,
  GetCompanyRequest,
  ListCompaniesRequest,
  ListCompaniesResponse,
  UpdateCompanyRequest,
  DeleteCompanyRequest,
  DeleteCompanyResponse,
  CompanyResponse,
  Review,
  CreateReviewRequest,
  ReviewResponse,
  ListReviewsRequest,
  ListReviewsResponse,
  CompanyServiceServer,
} from "../proto-generated/company";

export { CompanyServiceService, CompanyServiceClient } from "../proto-generated/company";

// ── Promisified Client (for BFF circuit-breaker wrapper) ──

import type {
  CreateCompanyRequest,
  CompanyResponse,
  GetCompanyRequest,
  ListCompaniesRequest,
  ListCompaniesResponse,
  UpdateCompanyRequest,
  DeleteCompanyRequest,
  DeleteCompanyResponse,
  CreateReviewRequest,
  ReviewResponse,
  ListReviewsRequest,
  ListReviewsResponse,
} from "../proto-generated/company";

export interface CompanyServicePromiseClient {
  createCompany(request: CreateCompanyRequest): Promise<CompanyResponse>;
  getCompany(request: GetCompanyRequest): Promise<CompanyResponse>;
  listCompanies(request: ListCompaniesRequest): Promise<ListCompaniesResponse>;
  updateCompany(request: UpdateCompanyRequest): Promise<CompanyResponse>;
  deleteCompany(request: DeleteCompanyRequest): Promise<DeleteCompanyResponse>;
  createReview(request: CreateReviewRequest): Promise<ReviewResponse>;
  listReviews(request: ListReviewsRequest): Promise<ListReviewsResponse>;
}
