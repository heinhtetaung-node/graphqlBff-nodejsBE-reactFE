exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    table.uuid("id").primary();
    table.string("email").unique().notNullable();
    table.string("password_hash").notNullable();
    table.string("name").notNullable();
    table.string("role").notNullable().index(); // TALENT_HUNTER, JOB_HUNTER
    table.string("phone");
    table.string("avatar_url");
    table.text("bio");
    table.uuid("company_id").index();
    table.specificType("skills", "text[]").defaultTo("{}");
    table.string("resume_url");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};
