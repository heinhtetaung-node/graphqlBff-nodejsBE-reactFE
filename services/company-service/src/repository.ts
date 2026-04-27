import type { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import type {
  Company,
  Review,
  InterviewExperience,
  CreateCompanyRequest,
  ListCompaniesRequest,
  UpdateCompanyRequest,
  CreateReviewRequest,
  ListReviewsRequest,
  CreateInterviewExperienceRequest,
  ListInterviewExperiencesRequest,
} from "../../../shared/proto-types/company";

// ── DB Row Types ──

interface CompanyRow {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  logo_url: string | null;
  location: string | null;
  employee_count: number | null;
  created_at: Date;
  updated_at: Date;
}

interface ReviewRow {
  id: string;
  company_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  position_title: string | null;
  created_at: Date;
}

interface InterviewExperienceRow {
  id: string;
  company_id: string;
  user_id: string;
  position_title: string;
  difficulty: number;
  result: string | null;
  description: string | null;
  interview_date: Date | null;
  created_at: Date;
}

// ── Mappers ──

function toProtoCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    website: row.website ?? "",
    industry: row.industry ?? "",
    logoUrl: row.logo_url ?? "",
    location: row.location ?? "",
    employeeCount: row.employee_count ?? 0,
    createdAt: row.created_at?.toISOString() ?? "",
    updatedAt: row.updated_at?.toISOString() ?? "",
  };
}

function toProtoReview(row: ReviewRow): Review {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: row.created_at?.toISOString() ?? "",
    positionTitle: row.position_title ?? "",
  };
}

function toProtoInterviewExperience(row: InterviewExperienceRow): InterviewExperience {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    positionTitle: row.position_title,
    difficulty: row.difficulty,
    result: row.result ?? "",
    description: row.description ?? "",
    interviewDate: row.interview_date ? row.interview_date.toISOString().split("T")[0] : "",
    createdAt: row.created_at?.toISOString() ?? "",
  };
}

// ── Repository ──

export class CompanyRepository {
  constructor(private readonly db: Knex) {}

  async create(data: CreateCompanyRequest): Promise<Company> {
    const id = uuidv4();
    const [row] = await this.db<CompanyRow>("companies")
      .insert({
        id,
        name: data.name,
        description: data.description,
        website: data.website,
        industry: data.industry,
        logo_url: data.logoUrl,
        location: data.location,
        employee_count: data.employeeCount,
      })
      .returning("*");
    return toProtoCompany(row);
  }

  async findById(id: string): Promise<Company | null> {
    const row = await this.db<CompanyRow>("companies").where("id", id).first();
    return row ? toProtoCompany(row) : null;
  }

  async list(
    params: ListCompaniesRequest,
  ): Promise<{ companies: Company[]; total: number }> {
    const { page = 1, limit = 20, industry } = params;
    const offset = (page - 1) * limit;

    let query = this.db<CompanyRow>("companies");
    if (industry) query = query.where("industry", industry);

    const [{ count }] = await query.clone().count();
    const rows = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return {
      companies: rows.map(toProtoCompany),
      total: parseInt(count as string, 10),
    };
  }

  async update(params: UpdateCompanyRequest): Promise<Company | null> {
    const { id, ...fields } = params;
    const updates: Record<string, unknown> = {};

    if (fields.name) updates.name = fields.name;
    if (fields.description) updates.description = fields.description;
    if (fields.website) updates.website = fields.website;
    if (fields.industry) updates.industry = fields.industry;
    if (fields.logoUrl) updates.logo_url = fields.logoUrl;
    if (fields.location) updates.location = fields.location;
    if (fields.employeeCount) updates.employee_count = fields.employeeCount;
    updates.updated_at = new Date();

    const [row] = await this.db<CompanyRow>("companies")
      .where("id", id)
      .update(updates)
      .returning("*");
    return row ? toProtoCompany(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db("companies").where("id", id).del();
    return deleted > 0;
  }
}

export class ReviewRepository {
  constructor(private readonly db: Knex) {}

  async create(data: CreateReviewRequest): Promise<Review> {
    const id = uuidv4();
    const [row] = await this.db<ReviewRow>("reviews")
      .insert({
        id,
        company_id: data.companyId,
        user_id: data.userId,
        rating: data.rating,
        comment: data.comment ?? null,
        position_title: data.positionTitle ?? null,
      })
      .returning("*");
    return toProtoReview(row);
  }

  async list(params: ListReviewsRequest): Promise<{
    reviews: Review[];
    total: number;
    averageRating: number;
  }> {
    const { companyId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.db("reviews")
      .where("company_id", companyId)
      .count();
    const rows = await this.db<ReviewRow>("reviews")
      .where("company_id", companyId)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);
    const [avgResult] = await this.db("reviews")
      .where("company_id", companyId)
      .avg("rating as avg");

    return {
      reviews: rows.map(toProtoReview),
      total: parseInt(count as string, 10),
      averageRating: avgResult?.avg ? parseFloat(avgResult.avg as string) : 0,
    };
  }
}

export class InterviewExperienceRepository {
  constructor(private readonly db: Knex) {}

  async create(data: CreateInterviewExperienceRequest): Promise<InterviewExperience> {
    const id = uuidv4();
    const [row] = await this.db<InterviewExperienceRow>("interview_experiences")
      .insert({
        id,
        company_id: data.companyId,
        user_id: data.userId,
        position_title: data.positionTitle,
        difficulty: data.difficulty,
        result: data.result || null,
        description: data.description || null,
        interview_date: data.interviewDate || null,
      })
      .returning("*");
    return toProtoInterviewExperience(row);
  }

  async list(params: ListInterviewExperiencesRequest): Promise<{
    interviewExperiences: InterviewExperience[];
    total: number;
    averageDifficulty: number;
  }> {
    const { companyId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.db("interview_experiences")
      .where("company_id", companyId)
      .count();
    const rows = await this.db<InterviewExperienceRow>("interview_experiences")
      .where("company_id", companyId)
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);
    const [avgResult] = await this.db("interview_experiences")
      .where("company_id", companyId)
      .avg("difficulty as avg");

    return {
      interviewExperiences: rows.map(toProtoInterviewExperience),
      total: parseInt(count as string, 10),
      averageDifficulty: avgResult?.avg ? parseFloat(avgResult.avg as string) : 0,
    };
  }
}
