import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const sqlite = new Database("data/users.db");
const db = drizzle(sqlite);
await migrate(db, { migrationsFolder: "./drizzle", migrationsSchema: "./db/schema.ts", migrationsTable: "users" });