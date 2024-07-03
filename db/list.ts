import { db } from "./index";
import * as schema from "./schema";

const users = await db.select().from(schema.users).all();

console.log(users)
