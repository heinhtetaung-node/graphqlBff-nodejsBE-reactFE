exports.up = function (knex) {
  return knex.schema.createTable("interview_experiences", (table) => {
    table.uuid("id").primary();
    table
      .uuid("company_id")
      .notNullable()
      .references("id")
      .inTable("companies")
      .onDelete("CASCADE");
    table.uuid("user_id").notNullable();
    table.string("position_title").notNullable();
    table.integer("difficulty").notNullable();
    table.string("result");
    table.text("description");
    table.date("interview_date");
    table.timestamps(true, true);
    table.unique(["company_id", "user_id", "position_title"]);
    table.index("company_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("interview_experiences");
};
