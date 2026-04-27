import type * as grpc from "@grpc/grpc-js";

// ── Messages ──

export interface Company {
  id: string;
  name: string;
  description: string;
  website: string;
  industry: string;
  logoUrl: string;
  location: string;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  companyId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  positionTitle: string;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
  location?: string;
  employeeCount?: number;
}

export interface GetCompanyRequest {
  id: string;
}

export interface ListCompaniesRequest {
  page?: number;
  limit?: number;
  industry?: string;
}

export interface ListCompaniesResponse {
  companies: Company[];
  total: number;
}

export interface UpdateCompanyRequest {
  id: string;
  name?: string;
  description?: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
  location?: string;
  employeeCount?: number;
}

export interface DeleteCompanyRequest {
  id: string;
}

export interface DeleteCompanyResponse {
  success: boolean;
}

export interface CompanyResponse {
  company: Company;
}

export interface CreateReviewRequest {
  companyId: string;
  userId: string;
  rating: number;
  comment?: string;
  positionTitle?: string;
}

export interface ReviewResponse {
  review: Review;
}

export interface ListReviewsRequest {
  companyId: string;
  page?: number;
  limit?: number;
}

export interface ListReviewsResponse {
  reviews: Review[];
  total: number;
  averageRating: number;
}

// ── Server Handlers ──

export interface CompanyServiceHandlers {
  CreateCompany: grpc.handleUnaryCall<CreateCompanyRequest, CompanyResponse>;
  GetCompany: grpc.handleUnaryCall<GetCompanyRequest, CompanyResponse>;
  ListCompanies: grpc.handleUnaryCall<
    ListCompaniesRequest,
    ListCompaniesResponse
  >;
  UpdateCompany: grpc.handleUnaryCall<UpdateCompanyRequest, CompanyResponse>;
  DeleteCompany: grpc.handleUnaryCall<
    DeleteCompanyRequest,
    DeleteCompanyResponse
  >;
  CreateReview: grpc.handleUnaryCall<CreateReviewRequest, ReviewResponse>;
  ListReviews: grpc.handleUnaryCall<ListReviewsRequest, ListReviewsResponse>;
}

// ── Promisified Client ──

export interface CompanyServiceClient {
  createCompany(request: CreateCompanyRequest): Promise<CompanyResponse>;
  getCompany(request: GetCompanyRequest): Promise<CompanyResponse>;
  listCompanies(request: ListCompaniesRequest): Promise<ListCompaniesResponse>;
  updateCompany(request: UpdateCompanyRequest): Promise<CompanyResponse>;
  deleteCompany(request: DeleteCompanyRequest): Promise<DeleteCompanyResponse>;
  createReview(request: CreateReviewRequest): Promise<ReviewResponse>;
  listReviews(request: ListReviewsRequest): Promise<ListReviewsResponse>;
}
