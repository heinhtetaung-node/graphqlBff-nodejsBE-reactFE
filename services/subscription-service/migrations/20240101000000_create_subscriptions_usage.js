exports.up = function (knex) {
  return knex.schema
    .createTable("subscriptions", (table) => {
      table.uuid("id").primary();
      table.uuid("user_id").notNullable().unique();
      table.string("plan").notNullable().index();
      table.decimal("price", 10, 2).defaultTo(0);
      table.string("status").defaultTo("ACTIVE").index();
      table.timestamp("starts_at").defaultTo(knex.fn.now());
      table.timestamp("ends_at");
      table.timestamps(true, true);
    })
    .createTable("usage", (table) => {
      table.uuid("id").primary();
      table.uuid("user_id").notNullable().index();
      table.string("action_type").notNullable(); // JOB_POST, JOB_APPLY
      table.integer("used_count").defaultTo(0);
      table.integer("max_count").defaultTo(10); // -1 = unlimited
      table.timestamp("period_start").notNullable();
      table.timestamp("period_end").notNullable();
      table.unique(["user_id", "action_type", "period_start"]);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable("usage").dropTable("subscriptions");
};
