import knex from "knex";
import config from "../knexfile";

async function migrate(): Promise<void> {
  const db = knex(config);
  try {
    const [batch, migrations] = await db.migrate.latest();
    if (migrations.length === 0) {
      console.log("Already up to date");
    } else {
      console.log(`Batch ${batch}: ${migrations.length} migration(s) applied`);
      migrations.forEach((m: any) => console.log(`  - ${m}`));
    }
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

migrate();
