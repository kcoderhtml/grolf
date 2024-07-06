import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";


const sqlite = new Database("db/users.db");
const db = drizzle(sqlite);
await migrate(db, { migrationsFolder: "./drizzle" });
export { db };