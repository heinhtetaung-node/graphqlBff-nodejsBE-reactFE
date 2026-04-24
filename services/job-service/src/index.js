const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const { createLogger } = require("../../../shared/logger");
const { addHealthCheck } = require("../../../shared/health");
const { gracefulShutdown } = require("../../../shared/shutdown");

const logger = createLogger("job-service");
const PROTO_PATH = path.join(__dirname, "../../../protos/job.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const jobProto = grpc.loadPackageDefinition(packageDefinition).job;

function toProtoJob(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    postedByUserId: row.posted_by_user_id,
    title: row.title,
    description: row.description || "",
    location: row.location || "",
    salaryRange: row.salary_range || "",
    jobType: row.job_type || "",
    experienceLevel: row.experience_level || "",
    skills: row.skills || [],
    isActive: row.is_active,
    createdAt: row.created_at?.toISOString() || "",
    updatedAt: row.updated_at?.toISOString() || "",
  };
}

function toProtoApplication(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    userId: row.user_id,
    coverLetter: row.cover_letter || "",
    resumeUrl: row.resume_url || "",
    status: row.status,
    createdAt: row.created_at?.toISOString() || "",
  };
}

const handlers = {
  async CreateJob(call, callback) {
    try {
      const {
        companyId,
        postedByUserId,
        title,
        description,
        location,
        salaryRange,
        jobType,
        experienceLevel,
        skills,
      } = call.request;
      const id = uuidv4();
      const [row] = await db("jobs")
        .insert({
          id,
          company_id: companyId,
          posted_by_user_id: postedByUserId,
          title,
          description,
          location,
          salary_range: salaryRange,
          job_type: jobType,
          experience_level: experienceLevel,
          skills: skills || [],
        })
        .returning("*");
      callback(null, { job: toProtoJob(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async GetJob(call, callback) {
    try {
      const row = await db("jobs").where("id", call.request.id).first();
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Job not found",
        });
      callback(null, { job: toProtoJob(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ListJobs(call, callback) {
    try {
      const {
        page = 1,
        limit = 20,
        jobType,
        experienceLevel,
        location,
        postedByUserId,
      } = call.request;
      const offset = (page - 1) * limit;
      let query = db("jobs").where("is_active", true);
      if (jobType) query = query.where("job_type", jobType);
      if (experienceLevel)
        query = query.where("experience_level", experienceLevel);
      if (location) query = query.whereILike("location", `%${location}%`);
      if (postedByUserId) query = query.where("posted_by_user_id", postedByUserId);
      const [{ count }] = await query.clone().count();
      const rows = await query
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);
      callback(null, { jobs: rows.map(toProtoJob), total: parseInt(count) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ListJobsByCompany(call, callback) {
    try {
      const { companyId, page = 1, limit = 20 } = call.request;
      const offset = (page - 1) * limit;
      const query = db("jobs").where("company_id", companyId);
      const [{ count }] = await query.clone().count();
      const rows = await query
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);
      callback(null, { jobs: rows.map(toProtoJob), total: parseInt(count) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async UpdateJob(call, callback) {
    try {
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
      } = call.request;
      const updates = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (location) updates.location = location;
      if (salaryRange) updates.salary_range = salaryRange;
      if (jobType) updates.job_type = jobType;
      if (experienceLevel) updates.experience_level = experienceLevel;
      if (skills && skills.length) updates.skills = skills;
      if (isActive !== undefined) updates.is_active = isActive;
      updates.updated_at = new Date();

      const [row] = await db("jobs")
        .where("id", id)
        .update(updates)
        .returning("*");
      if (!row)
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Job not found",
        });
      callback(null, { job: toProtoJob(row) });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async DeleteJob(call, callback) {
    try {
      const deleted = await db("jobs").where("id", call.request.id).del();
      callback(null, { success: deleted > 0 });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ApplyToJob(call, callback) {
    try {
      const { jobId, userId, coverLetter, resumeUrl } = call.request;
      const id = uuidv4();
      const [row] = await db("applications")
        .insert({
          id,
          job_id: jobId,
          user_id: userId,
          cover_letter: coverLetter,
          resume_url: resumeUrl,
        })
        .returning("*");
      callback(null, { application: toProtoApplication(row) });
    } catch (err) {
      if (err.code === "23505") {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: "Already applied to this job",
        });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ListApplicationsByJob(call, callback) {
    try {
      const { jobId, page = 1, limit = 20 } = call.request;
      const offset = (page - 1) * limit;
      const query = db("applications").where("job_id", jobId);
      const [{ count }] = await query.clone().count();
      const rows = await query
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);
      callback(null, {
        applications: rows.map(toProtoApplication),
        total: parseInt(count),
      });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  async ListApplicationsByUser(call, callback) {
    try {
      const { userId, page = 1, limit = 20 } = call.request;
      const offset = (page - 1) * limit;
      const query = db("applications").where("user_id", userId);
      const [{ count }] = await query.clone().count();
      const rows = await query
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);
      callback(null, {
        applications: rows.map(toProtoApplication),
        total: parseInt(count),
      });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};

function main() {
  const server = new grpc.Server();
  server.addService(jobProto.JobService.service, handlers);

  const health = addHealthCheck(server, logger);

  const port = process.env.GRPC_PORT || "50052";
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err) => {
      if (err) {
        logger.fatal({ err }, "Failed to bind server");
        process.exit(1);
      }
      health.setServing();
      logger.info({ port }, "Job service running");
    },
  );

  gracefulShutdown(server, db, logger);
}

main();
