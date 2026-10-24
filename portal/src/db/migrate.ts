import { db } from "./index";

await db();
console.log("Migration tamam.");
process.exit(0);
