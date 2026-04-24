const db = require('./db');

async function migrate() {
  const subsExist = await db.schema.hasTable('subscriptions');
  if (!subsExist) {
    await db.schema.createTable('subscriptions', (table) => {
      table.uuid('id').primary();
      table.uuid('user_id').notNullable().unique();
      table.string('plan').notNullable();
      table.decimal('price', 10, 2).defaultTo(0);
      table.string('status').defaultTo('ACTIVE');
      table.timestamp('starts_at').defaultTo(db.fn.now());
      table.timestamp('ends_at');
      table.timestamps(true, true);
    });
    console.log('subscriptions table created');
  }

  const usageExist = await db.schema.hasTable('usage');
  if (!usageExist) {
    await db.schema.createTable('usage', (table) => {
      table.uuid('id').primary();
      table.uuid('user_id').notNullable();
      table.string('action_type').notNullable(); // JOB_POST, JOB_APPLY
      table.integer('used_count').defaultTo(0);
      table.integer('max_count').defaultTo(10); // -1 = unlimited
      table.timestamp('period_start').notNullable();
      table.timestamp('period_end').notNullable();
      table.unique(['user_id', 'action_type', 'period_start']);
    });
    console.log('usage table created');
  }

  await db.destroy();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
