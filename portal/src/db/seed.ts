import { db } from "./index";
import { seedDemo } from "./seed-data";

// `pnpm db:seed` / `pnpm db:reset`: demo kataloğu yükler.
const done = await seedDemo(await db());
console.log(done ? "Seed tamam: demo katalog yüklendi." : "Veritabanında ürün var, seed atlandı. Sıfırlamak için: pnpm db:reset");
process.exit(0);
