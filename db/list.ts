import { db } from "./index";
import * as schema from "./schema";

// for each key in schema, print the table name
for (const key in schema) {
    // @ts-expect-error
    const table = await db.select().from(schema[key]).execute();
    console.log(table)
}