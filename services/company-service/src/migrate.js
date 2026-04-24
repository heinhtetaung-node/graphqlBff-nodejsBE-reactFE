const db = require("./db");

async function migrate() {
  const exists = await db.schema.hasTable("companies");
  if (!exists) {
    await db.schema.createTable("companies", (table) => {
      table.uuid("id").primary();
      table.string("name").notNullable();
      table.text("description");
      table.string("website");
      table.string("industry");
      table.string("logo_url");
      table.string("location");
      table.integer("employee_count").defaultTo(0);
      table.timestamps(true, true);
    });
    console.log("companies table created");
  } else {
    console.log("companies table already exists");
  }
  await db.destroy();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
