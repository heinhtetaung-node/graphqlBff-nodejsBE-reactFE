exports.up = function (knex) {
  return knex.schema.createTable("companies", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.text("description");
    table.string("website");
    table.string("industry").index();
    table.string("logo_url");
    table.string("location");
    table.integer("employee_count").defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("companies");
};
