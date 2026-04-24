const db = require("./db");

async function migrate() {
  const jobsExist = await db.schema.hasTable("jobs");
  if (!jobsExist) {
    await db.schema.createTable("jobs", (table) => {
      table.uuid("id").primary();
      table.uuid("company_id").notNullable();
      table.uuid("posted_by_user_id").notNullable();
      table.string("title").notNullable();
      table.text("description");
      table.string("location");
      table.string("salary_range");
      table.string("job_type");
      table.string("experience_level");
      table.specificType("skills", "text[]").defaultTo("{}");
      table.boolean("is_active").defaultTo(true);
      table.timestamps(true, true);
    });
    console.log("jobs table created");
  }

  const appsExist = await db.schema.hasTable("applications");
  if (!appsExist) {
    await db.schema.createTable("applications", (table) => {
      table.uuid("id").primary();
      table
        .uuid("job_id")
        .notNullable()
        .references("id")
        .inTable("jobs")
        .onDelete("CASCADE");
      table.uuid("user_id").notNullable();
      table.text("cover_letter");
      table.string("resume_url");
      table.string("status").defaultTo("PENDING");
      table.timestamp("created_at").defaultTo(db.fn.now());
      table.unique(["job_id", "user_id"]);
    });
    console.log("applications table created");
  }

  await db.destroy();
  console.log("Migration complete");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
