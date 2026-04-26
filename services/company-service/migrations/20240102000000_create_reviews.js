exports.up = function (knex) {
  return knex.schema.createTable("reviews", (table) => {
    table.uuid("id").primary();
    table
      .uuid("company_id")
      .notNullable()
      .references("id")
      .inTable("companies")
      .onDelete("CASCADE");
    table.uuid("user_id").notNullable();
    table.integer("rating").notNullable();
    table.text("comment");
    table.string("position_title");
    table.timestamps(true, true);
    table.unique(["company_id", "user_id"]);
    table.index("company_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("reviews");
};
