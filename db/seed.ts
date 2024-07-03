import { db } from "./index";
import * as schema from "./schema";

await db.insert(schema.users).values([
    {
        userID: "U0123456789",
        userName: "Grolf",
    }
]);

console.log(`Seeding complete.`);