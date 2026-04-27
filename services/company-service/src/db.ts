import knex, { Knex } from "knex";
import { config } from "./config";

const db: Knex = knex({
  client: "pg",
  connection: config.db,
});

export default db;
