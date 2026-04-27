import type { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import type {
  Job,
  Application,
  CreateJobRequest,
  ListJobsRequest,
  UpdateJobRequest,
  ApplyToJobRequest,
  ListApplicationsByJobRequest,
  ListApplicationsByUserRequest,
  ListJobsByCompanyRequest,
} from "../../../shared/proto-types/job";

interface JobRow {
  id: string;
  company_id: string;
  posted_by_user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  salary_range: string | null;
  job_type: string | null;
  experience_level: string | null;
  skills: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ApplicationRow {
  id: string;
  job_id: string;
  user_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  status: string;
  created_at: Date;
}

function toProtoJob(row: JobRow): Job {
  return {
    id: row.id,
    companyId: row.company_id,
    postedByUserId: row.posted_by_user_id,
    title: row.title,
    description: row.description ?? "",
    location: row.location ?? "",
    salaryRange: row.salary_range ?? "",
    jobType: row.job_type ?? "",
    experienceLevel: row.experience_level ?? "",
    skills: row.skills ?? [],
    isActive: row.is_active,
    createdAt: row.created_at?.toISOString() ?? "",
    updatedAt: row.updated_at?.toISOString() ?? "",
  };
}

function toProtoApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    jobId: row.job_id,
    userId: row.user_id,
    coverLetter: row.cover_letter ?? "",
    resumeUrl: row.resume_url ?? "",
    status: row.status,
    createdAt: row.created_at?.toISOString() ?? "",
  };
}

export class JobRepository {
  constructor(private readonly db: Knex) {}

  async create(data: CreateJobRequest): Promise<Job> {
    const id = uuidv4();
    const [row] = await this.db<JobRow>("jobs")
      .insert({
        id,
        company_id: data.companyId,
        posted_by_user_id: data.postedByUserId,
        title: data.title,
        description: data.description,
        location: data.location,
        salary_range: data.salaryRange,
        job_type: data.jobType,
        experience_level: data.experienceLevel,
        skills: data.skills ?? [],
      })
      .returning("*");
    return toProtoJob(row);
  }

  async findById(id: string): Promise<Job | null> {
    const row = await this.db<JobRow>("jobs").where("id", id).first();
    return row ? toProtoJob(row) : null;
  }

  async list(params: ListJobsRequest): Promise<{ jobs: Job[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      jobType,
      experienceLevel,
      location,
      postedByUserId,
      companyId,
    } = params;
    const offset = (page - 1) * limit;

    let query = this.db<JobRow>("jobs").where("is_active", true);
    if (jobType) query = query.where("job_type", jobType);
    if (experienceLevel)
      query = query.where("experience_level", experienceLevel);
    if (location) query = query.whereILike("location", `%${location}%`);
    if (postedByUserId)
      query = query.where("posted_by_user_id", postedByUserId);
    if (companyId) query = query.where("company_id", companyId);

    const [{ count }] = await query.clone().count();
    const rows = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return { jobs: rows.map(toProtoJob), total: parseInt(count as string, 10) };
  }

  async listByCompany(
    params: ListJobsByCompanyRequest,
  ): Promise<{ jobs: Job[]; total: number }> {
    const { companyId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const query = this.db<JobRow>("jobs").where("company_id", companyId);
    const [{ count }] = await query.clone().count();
    const rows = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return { jobs: rows.map(toProtoJob), total: parseInt(count as string, 10) };
  }

  async update(params: UpdateJobRequest): Promise<Job | null> {
    const {
      id,
      title,
      description,
      location,
      salaryRange,
      jobType,
      experienceLevel,
      skills,
      isActive,
    } = params;
    const updates: Record<string, unknown> = {};

    if (title) updates.title = title;
    if (description) updates.description = description;
    if (location) updates.location = location;
    if (salaryRange) updates.salary_range = salaryRange;
    if (jobType) updates.job_type = jobType;
    if (experienceLevel) updates.experience_level = experienceLevel;
    if (skills && skills.length) updates.skills = skills;
    if (isActive !== undefined) updates.is_active = isActive;
    updates.updated_at = new Date();

    const [row] = await this.db<JobRow>("jobs")
      .where("id", id)
      .update(updates)
      .returning("*");
    return row ? toProtoJob(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db("jobs").where("id", id).del();
    return deleted > 0;
  }
}

export class ApplicationRepository {
  constructor(private readonly db: Knex) {}

  async create(data: ApplyToJobRequest): Promise<Application> {
    const id = uuidv4();
    const [row] = await this.db<ApplicationRow>("applications")
      .insert({
        id,
        job_id: data.jobId,
        user_id: data.userId,
        cover_letter: data.coverLetter,
        resume_url: data.resumeUrl,
      })
      .returning("*");
    return toProtoApplication(row);
  }

  async listByJob(
    params: ListApplicationsByJobRequest,
  ): Promise<{ applications: Application[]; total: number }> {
    const { jobId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const query = this.db<ApplicationRow>("applications").where(
      "job_id",
      jobId,
    );
    const [{ count }] = await query.clone().count();
    const rows = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return {
      applications: rows.map(toProtoApplication),
      total: parseInt(count as string, 10),
    };
  }

  async listByUser(
    params: ListApplicationsByUserRequest,
  ): Promise<{ applications: Application[]; total: number }> {
    const { userId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const query = this.db<ApplicationRow>("applications").where(
      "user_id",
      userId,
    );
    const [{ count }] = await query.clone().count();
    const rows = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return {
      applications: rows.map(toProtoApplication),
      total: parseInt(count as string, 10),
    };
  }
}
