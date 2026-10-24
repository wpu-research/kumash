import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Para birimleri kuruş cinsinden tamsayı tutulur (34999 = 349,99 TL).

export const gender = pgEnum("gender", ["kadin", "erkek"]);
export const productStatus = pgEnum("product_status", ["taslak", "onayda", "yayinda", "arsiv"]);
export const assetKind = pgEnum("asset_kind", ["ham", "kesik", "manken", "kombin", "sosyal"]);
export const channel = pgEnum("channel", ["site", "trendyol", "instagram"]);
export const listingStatus = pgEnum("listing_status", ["bekliyor", "yayinda", "kimlik_yok", "hata", "reddedildi"]);
export const shootStatus = pgEnum("shoot_status", ["yuklendi", "isleniyor", "tamamlandi", "hata"]);
export const jobStatus = pgEnum("job_status", ["bekliyor", "calisiyor", "tamamlandi", "hata"]);
export const orderStatus = pgEnum("order_status", ["alindi", "hazirlaniyor", "kargoda", "teslim", "iptal"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  gender: gender("gender").notNull(),
  // ürün görseli üretiminde kullanılan giysi tipi (elbise, pantolon, ...)
  garment: text("garment").notNull(),
  sort: integer("sort").notNull().default(0),
});

export const shoots = pgTable("shoots", {
  id: serial("id").primaryKey(),
  note: text("note"),
  status: shootStatus("status").notNull().default("yuklendi"),
  photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    shootId: integer("shoot_id").references(() => shoots.id),
    color: text("color").notNull(),
    colorHex: text("color_hex").notNull(),
    pattern: text("pattern").notNull().default("duz"),
    fabric: text("fabric").notNull(),
    fit: text("fit").notNull().default("Regular"),
    price: integer("price").notNull(),
    comparePrice: integer("compare_price"),
    status: productStatus("status").notNull().default("taslak"),
    aiGenerated: boolean("ai_generated").notNull().default(true),
    // Trendyol özellik alanlarına da giden serbest özellikler (yaka, kol, boy ...)
    attrs: jsonb("attrs").$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [index("products_status_idx").on(t.status), index("products_category_idx").on(t.categoryId)],
);

export const variants = pgTable(
  "variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    sku: text("sku").notNull().unique(),
    barcode: text("barcode").notNull(),
    stock: integer("stock").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const assets = pgTable(
  "assets",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
    shootId: integer("shoot_id").references(() => shoots.id),
    kind: assetKind("kind").notNull(),
    url: text("url").notNull(),
    model: text("model"),
    qcScore: integer("qc_score"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("assets_product_idx").on(t.productId)],
);

export const outfits = pgTable("outfits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productIds: jsonb("product_ids").$type<number[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const channelListings = pgTable(
  "channel_listings",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    channel: channel("channel").notNull(),
    externalId: text("external_id"),
    status: listingStatus("status").notNull().default("bekliyor"),
    lastError: text("last_error"),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("listing_product_channel_uq").on(t.productId, t.channel)],
);

export type JobLog = { at: string; msg: string };

export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: jobStatus("status").notNull().default("bekliyor"),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    log: jsonb("log").$type<JobLog[]>().notNull().default([]),
    costCents: integer("cost_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("jobs_status_idx").on(t.status)],
);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  no: text("no").notNull().unique(),
  channel: channel("channel").notNull().default("site"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  total: integer("total").notNull(),
  shipping: integer("shipping").notNull().default(0),
  payment: text("payment").notNull(),
  status: orderStatus("status").notNull().default("alindi"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  variantId: integer("variant_id").notNull().references(() => variants.id),
  title: text("title").notNull(),
  size: text("size").notNull(),
  price: integer("price").notNull(),
  qty: integer("qty").notNull(),
});

export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Order = typeof orders.$inferSelect;
