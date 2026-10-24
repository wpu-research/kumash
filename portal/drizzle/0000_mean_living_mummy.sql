CREATE TYPE "public"."asset_kind" AS ENUM('ham', 'kesik', 'manken', 'kombin', 'sosyal');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('site', 'trendyol', 'instagram');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('kadin', 'erkek');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('bekliyor', 'calisiyor', 'tamamlandi', 'hata');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('bekliyor', 'yayinda', 'kimlik_yok', 'hata', 'reddedildi');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('alindi', 'hazirlaniyor', 'kargoda', 'teslim', 'iptal');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('taslak', 'onayda', 'yayinda', 'arsiv');--> statement-breakpoint
CREATE TYPE "public"."shoot_status" AS ENUM('yuklendi', 'isleniyor', 'tamamlandi', 'hata');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"shoot_id" integer,
	"kind" "asset_kind" NOT NULL,
	"url" text NOT NULL,
	"model" text,
	"qc_score" integer,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"gender" "gender" NOT NULL,
	"garment" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "channel_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"channel" "channel" NOT NULL,
	"external_id" text,
	"status" "listing_status" DEFAULT 'bekliyor' NOT NULL,
	"last_error" text,
	"synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "job_status" DEFAULT 'bekliyor' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"log" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"title" text NOT NULL,
	"size" text NOT NULL,
	"price" integer NOT NULL,
	"qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"no" text NOT NULL,
	"channel" "channel" DEFAULT 'site' NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"total" integer NOT NULL,
	"shipping" integer DEFAULT 0 NOT NULL,
	"payment" text NOT NULL,
	"status" "order_status" DEFAULT 'alindi' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_no_unique" UNIQUE("no")
);
--> statement-breakpoint
CREATE TABLE "outfits" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"product_ids" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category_id" integer NOT NULL,
	"shoot_id" integer,
	"color" text NOT NULL,
	"color_hex" text NOT NULL,
	"pattern" text DEFAULT 'duz' NOT NULL,
	"fabric" text NOT NULL,
	"fit" text DEFAULT 'Regular' NOT NULL,
	"price" integer NOT NULL,
	"compare_price" integer,
	"status" "product_status" DEFAULT 'taslak' NOT NULL,
	"ai_generated" boolean DEFAULT true NOT NULL,
	"attrs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shoots" (
	"id" serial PRIMARY KEY NOT NULL,
	"note" text,
	"status" "shoot_status" DEFAULT 'yuklendi' NOT NULL,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"size" text NOT NULL,
	"sku" text NOT NULL,
	"barcode" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_shoot_id_shoots_id_fk" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_shoot_id_shoots_id_fk" FOREIGN KEY ("shoot_id") REFERENCES "public"."shoots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_product_idx" ON "assets" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_product_channel_uq" ON "channel_listings" USING btree ("product_id","channel");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "variants_product_idx" ON "variants" USING btree ("product_id");