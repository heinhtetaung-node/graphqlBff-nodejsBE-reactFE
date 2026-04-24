exports.up = function (knex) {
  return knex.schema
    .createTable("jobs", (table) => {
      table.uuid("id").primary();
      table.uuid("company_id").notNullable().index();
      table.uuid("posted_by_user_id").notNullable().index();
      table.string("title").notNullable();
      table.text("description");
      table.string("location");
      table.string("salary_range");
      table.string("job_type").index();
      table.string("experience_level").index();
      table.specificType("skills", "text[]").defaultTo("{}");
      table.boolean("is_active").defaultTo(true).index();
      table.timestamps(true, true);
    })
    .createTable("applications", (table) => {
      table.uuid("id").primary();
      table
        .uuid("job_id")
        .notNullable()
        .references("id")
        .inTable("jobs")
        .onDelete("CASCADE")
        .index();
      table.uuid("user_id").notNullable().index();
      table.text("cover_letter");
      table.string("resume_url");
      table.string("status").defaultTo("PENDING").index();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.unique(["job_id", "user_id"]);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable("applications").dropTable("jobs");
};
