exports.up = function (knex) {
  return knex.schema.alterTable("reviews", (table) => {
    table.string("position_title");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("reviews", (table) => {
    table.dropColumn("position_title");
  });
};
