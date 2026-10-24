import path from "node:path";
import * as schema from "./schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

// DATABASE_URL varsa gerçek Postgres (Railway), yoksa ./.data altında gömülü PGlite.
// Dev sunucusundaki hot-reload bağlantıyı çoğaltmasın diye globalThis'te tutulur.
const g = globalThis as unknown as { __kumashDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url, { max: 10 });
    const d = drizzle(client, { schema });
    await migrate(d, { migrationsFolder: MIGRATIONS });
    return d as unknown as DB;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(path.join(process.cwd(), ".data"));
  const d = drizzle(client, { schema });
  await migrate(d, { migrationsFolder: MIGRATIONS });
  return d as unknown as DB;
}

// SEED_DEMO=1: ilk bağlantıda veritabanı boşsa demo katalog yüklenir (Railway'de DB'yi dışarı açmadan seed için)
async function connectAndSeed(): Promise<DB> {
  const d = await connect();
  if (process.env.SEED_DEMO === "1") {
    const { seedDemo } = await import("./seed-data");
    if (await seedDemo(d)) console.log("[kumash] demo katalog yüklendi");
  }
  return d;
}

export function db(): Promise<DB> {
  if (!g.__kumashDb) g.__kumashDb = connectAndSeed();
  return g.__kumashDb;
}

export { schema };
