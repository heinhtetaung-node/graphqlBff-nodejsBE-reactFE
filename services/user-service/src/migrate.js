const db = require("./db");

async function migrate() {
  const exists = await db.schema.hasTable("users");
  if (!exists) {
    await db.schema.createTable("users", (table) => {
      table.uuid("id").primary();
      table.string("email").unique().notNullable();
      table.string("password_hash").notNullable();
      table.string("name").notNullable();
      table.string("role").notNullable(); // TALENT_HUNTER, JOB_HUNTER
      table.string("phone");
      table.string("avatar_url");
      table.text("bio");
      table.uuid("company_id");
      table.specificType("skills", "text[]").defaultTo("{}");
      table.string("resume_url");
      table.timestamps(true, true);
    });
    console.log("users table created");
  } else {
    console.log("users table already exists");
  }
  await db.destroy();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
