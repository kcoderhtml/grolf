import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";


const sqlite = new Database("data/users.db");
const db = drizzle(sqlite);
await migrate(db, { migrationsFolder: "./drizzle", migrationsSchema: "./schema.ts" });
export { db };