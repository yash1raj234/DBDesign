/**
 * lib/mock-data.ts
 * ─────────────────────────────────────────────────────────────
 * Hardcoded ERDSchema for Phase 3 (no backend calls).
 * 3 tables: users, orders, products
 * 1 junction: order_items (for N:M)
 * 1 enum: OrderStatus
 * Also exports pre-built SQL, Prisma, DBML, Migration strings for Monaco.
 */

import {
  ERDSchema,
  DBTarget,
  DataType,
  RelationshipType,
  FKAction,
  IndexType,
} from "./types";

// ─── Mock ERD Schema ──────────────────────────────────────────
export const MOCK_SCHEMA: ERDSchema = {
  schema_version: "1.0.0",
  db_target: DBTarget.POSTGRESQL,
  schema_name: "ecommerce_db",
  title: "E-Commerce Platform",
  description: "Complete e-commerce schema with users, orders, products, and order items.",
  enums: [
    {
      name: "OrderStatus",
      values: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      comment: "Lifecycle states for a customer order",
    },
  ],
  tables: [
    {
      name: "users",
      comment: "Registered platform users",
      columns: [
        { name: "id",         data_type: DataType.UUID,        is_primary_key: true,  is_nullable: false, is_unique: true,  is_auto_increment: false, default_value: "gen_random_uuid()" },
        { name: "email",      data_type: DataType.VARCHAR,     is_primary_key: false, is_nullable: false, is_unique: true,  is_auto_increment: false, type_params: { length: 255 } },
        { name: "name",       data_type: DataType.VARCHAR,     is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, type_params: { length: 120 } },
        { name: "avatar_url", data_type: DataType.TEXT,        is_primary_key: false, is_nullable: true,  is_unique: false, is_auto_increment: false },
        { name: "created_at", data_type: DataType.TIMESTAMPTZ, is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, default_value: "NOW()" },
        { name: "updated_at", data_type: DataType.TIMESTAMPTZ, is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, default_value: "NOW()" },
      ],
      foreign_keys: [],
      indexes: [
        { name: "users_email_idx", columns: ["email"], index_type: IndexType.BTREE, is_unique: true },
      ],
    },
    {
      name: "products",
      comment: "Product catalog",
      columns: [
        { name: "id",          data_type: DataType.UUID,        is_primary_key: true,  is_nullable: false, is_unique: true,  is_auto_increment: false, default_value: "gen_random_uuid()" },
        { name: "name",        data_type: DataType.VARCHAR,     is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, type_params: { length: 255 } },
        { name: "description", data_type: DataType.TEXT,        is_primary_key: false, is_nullable: true,  is_unique: false, is_auto_increment: false },
        { name: "price",       data_type: DataType.DECIMAL,     is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, type_params: { precision: 10, scale: 2 } },
        { name: "stock_qty",   data_type: DataType.INTEGER,     is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, default_value: "0" },
        { name: "sku",         data_type: DataType.VARCHAR,     is_primary_key: false, is_nullable: false, is_unique: true,  is_auto_increment: false, type_params: { length: 80 } },
        { name: "created_at",  data_type: DataType.TIMESTAMPTZ, is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, default_value: "NOW()" },
      ],
      foreign_keys: [],
      indexes: [
        { name: "products_sku_idx", columns: ["sku"], index_type: IndexType.BTREE, is_unique: true },
      ],
    },
    {
      name: "orders",
      comment: "Customer orders",
      columns: [
        { name: "id",         data_type: DataType.UUID,        is_primary_key: true,  is_nullable: false, is_unique: true,  is_auto_increment: false, default_value: "gen_random_uuid()" },
        { name: "user_id",    data_type: DataType.UUID,        is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false },
        { name: "status",     data_type: DataType.ENUM,        is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, default_value: "PENDING", enum_values: ["PENDING","PROCESSING","SHIPPED","DELIVERED","CANCELLED"] },
        { name: "total",      data_type: DataType.DECIMAL,     is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, type_params: { precision: 10, scale: 2 } },
        { name: "note",       data_type: DataType.TEXT,        is_primary_key: false, is_nullable: true,  is_unique: false, is_auto_increment: false },
        { name: "placed_at",  data_type: DataType.TIMESTAMPTZ, is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, default_value: "NOW()" },
        { name: "updated_at", data_type: DataType.TIMESTAMPTZ, is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, default_value: "NOW()" },
      ],
      foreign_keys: [
        {
          constraint_name: "orders_user_id_fk",
          columns: ["user_id"],
          referenced_table: "users",
          referenced_columns: ["id"],
          on_delete: FKAction.CASCADE,
          on_update: FKAction.NO_ACTION,
        },
      ],
      indexes: [
        { name: "orders_user_id_idx", columns: ["user_id"], index_type: IndexType.BTREE, is_unique: false },
        { name: "orders_status_idx",  columns: ["status"],  index_type: IndexType.BTREE, is_unique: false },
      ],
    },
    {
      name: "order_items",
      comment: "Junction table: orders ↔ products (N:M)",
      columns: [
        { name: "id",           data_type: DataType.UUID,    is_primary_key: true,  is_nullable: false, is_unique: true,  is_auto_increment: false, default_value: "gen_random_uuid()" },
        { name: "order_id",     data_type: DataType.UUID,    is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false },
        { name: "product_id",   data_type: DataType.UUID,    is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false },
        { name: "quantity",     data_type: DataType.INTEGER, is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, check_constraint: "quantity > 0" },
        { name: "unit_price",   data_type: DataType.DECIMAL, is_primary_key: false, is_nullable: false, is_unique: false, is_auto_increment: false, type_params: { precision: 10, scale: 2 } },
      ],
      foreign_keys: [
        {
          constraint_name: "order_items_order_id_fk",
          columns: ["order_id"],
          referenced_table: "orders",
          referenced_columns: ["id"],
          on_delete: FKAction.CASCADE,
          on_update: FKAction.NO_ACTION,
        },
        {
          constraint_name: "order_items_product_id_fk",
          columns: ["product_id"],
          referenced_table: "products",
          referenced_columns: ["id"],
          on_delete: FKAction.RESTRICT,
          on_update: FKAction.NO_ACTION,
        },
      ],
      indexes: [
        { name: "order_items_order_product_idx", columns: ["order_id","product_id"], index_type: IndexType.BTREE, is_unique: true },
      ],
    },
  ],
  relationships: [
    {
      name: "users_to_orders",
      from_table: "users",
      from_column: "id",
      to_table: "orders",
      to_column: "user_id",
      relationship_type: RelationshipType.ONE_TO_MANY,
      label: "places",
    },
    {
      name: "orders_to_products",
      from_table: "orders",
      from_column: "id",
      to_table: "products",
      to_column: "id",
      relationship_type: RelationshipType.MANY_TO_MANY,
      label: "contains",
      junction_table: "order_items",
    },
  ],
};

// ─── Mock SQL Output ──────────────────────────────────────────
export const MOCK_SQL = `-- Generated by DBDesign Platform
-- Target: PostgreSQL
-- Schema: ecommerce_db

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
);

CREATE TABLE "users" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "email"      VARCHAR(255) NOT NULL UNIQUE,
  "name"       VARCHAR(120) NOT NULL,
  "avatar_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "products" (
  "id"          UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "name"        VARCHAR(255)    NOT NULL,
  "description" TEXT,
  "price"       DECIMAL(10, 2)  NOT NULL,
  "stock_qty"   INTEGER         NOT NULL DEFAULT 0,
  "sku"         VARCHAR(80)     NOT NULL UNIQUE,
  "created_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE "orders" (
  "id"         UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"    UUID           NOT NULL,
  "status"     "OrderStatus"  NOT NULL DEFAULT 'PENDING',
  "total"      DECIMAL(10, 2) NOT NULL,
  "note"       TEXT,
  "placed_at"  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT "orders_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "order_items" (
  "id"         UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "order_id"   UUID           NOT NULL,
  "product_id" UUID           NOT NULL,
  "quantity"   INTEGER        NOT NULL CHECK (quantity > 0),
  "unit_price" DECIMAL(10, 2) NOT NULL,
  CONSTRAINT "order_items_order_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "order_items_product_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
  CONSTRAINT "order_items_order_product_unique"
    UNIQUE ("order_id", "product_id")
);

-- Indexes
CREATE UNIQUE INDEX "users_email_idx"               ON "users"       ("email");
CREATE UNIQUE INDEX "products_sku_idx"              ON "products"    ("sku");
CREATE        INDEX "orders_user_id_idx"            ON "orders"      ("user_id");
CREATE        INDEX "orders_status_idx"             ON "orders"      ("status");
CREATE UNIQUE INDEX "order_items_order_product_idx" ON "order_items" ("order_id", "product_id");
`;

// ─── Mock Prisma Schema ───────────────────────────────────────
export const MOCK_PRISMA = `// Generated by DBDesign Platform
// Target: PostgreSQL

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique @db.VarChar(255)
  name      String   @db.VarChar(120)
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz()
  orders    Order[]

  @@map("users")
}

model Product {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String      @db.VarChar(255)
  description String?
  price       Decimal     @db.Decimal(10, 2)
  stockQty    Int         @default(0) @map("stock_qty")
  sku         String      @unique @db.VarChar(80)
  createdAt   DateTime    @default(now()) @map("created_at") @db.Timestamptz()
  orderItems  OrderItem[]

  @@map("products")
}

model Order {
  id         String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String      @map("user_id") @db.Uuid
  status     OrderStatus @default(PENDING)
  total      Decimal     @db.Decimal(10, 2)
  note       String?
  placedAt   DateTime    @default(now()) @map("placed_at") @db.Timestamptz()
  updatedAt  DateTime    @updatedAt @map("updated_at") @db.Timestamptz()
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  items      OrderItem[]

  @@map("orders")
}

model OrderItem {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId   String  @map("order_id") @db.Uuid
  productId String  @map("product_id") @db.Uuid
  quantity  Int
  unitPrice Decimal @map("unit_price") @db.Decimal(10, 2)
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@unique([orderId, productId])
  @@map("order_items")
}
`;

// ─── Mock DBML ────────────────────────────────────────────────
export const MOCK_DBML = `// Generated by DBDesign Platform
// https://dbml.dbdiagram.io

Table users {
  id         uuid        [pk, default: \`gen_random_uuid()\`]
  email      varchar(255) [not null, unique]
  name       varchar(120) [not null]
  avatar_url text
  created_at timestamptz [not null, default: \`now()\`]
  updated_at timestamptz [not null, default: \`now()\`]
}

Table products {
  id          uuid           [pk, default: \`gen_random_uuid()\`]
  name        varchar(255)   [not null]
  description text
  price       decimal(10,2)  [not null]
  stock_qty   integer        [not null, default: 0]
  sku         varchar(80)    [not null, unique]
  created_at  timestamptz    [not null, default: \`now()\`]
}

Table orders {
  id         uuid           [pk, default: \`gen_random_uuid()\`]
  user_id    uuid           [not null, ref: > users.id]
  status     OrderStatus    [not null, default: 'PENDING']
  total      decimal(10,2)  [not null]
  note       text
  placed_at  timestamptz    [not null, default: \`now()\`]
  updated_at timestamptz    [not null, default: \`now()\`]
}

Table order_items {
  id         uuid           [pk, default: \`gen_random_uuid()\`]
  order_id   uuid           [not null, ref: > orders.id]
  product_id uuid           [not null, ref: > products.id]
  quantity   integer        [not null, note: 'CHECK (quantity > 0)']
  unit_price decimal(10,2)  [not null]

  indexes {
    (order_id, product_id) [unique]
  }
}

Enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
`;

// ─── Mock Migration ───────────────────────────────────────────
export const MOCK_MIGRATION = `-- Migration: 0001_initial_ecommerce_schema
-- Created at: ${new Date().toISOString()}
-- Generated by DBDesign Platform

BEGIN;

-- Create enum type
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
);

-- Create base tables (no foreign keys first)
CREATE TABLE IF NOT EXISTS "users" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "email"      VARCHAR(255) NOT NULL,
  "name"       VARCHAR(120) NOT NULL,
  "avatar_url" TEXT,
  "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_unique" UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "products" (
  "id"          UUID            NOT NULL DEFAULT gen_random_uuid(),
  "name"        VARCHAR(255)    NOT NULL,
  "description" TEXT,
  "price"       DECIMAL(10, 2)  NOT NULL,
  "stock_qty"   INTEGER         NOT NULL DEFAULT 0,
  "sku"         VARCHAR(80)     NOT NULL,
  "created_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "products_sku_unique" UNIQUE ("sku")
);

-- Create tables with foreign keys
CREATE TABLE IF NOT EXISTS "orders" (
  "id"         UUID           NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    UUID           NOT NULL,
  "status"     "OrderStatus"  NOT NULL DEFAULT 'PENDING',
  "total"      DECIMAL(10, 2) NOT NULL,
  "note"       TEXT,
  "placed_at"  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id"         UUID           NOT NULL DEFAULT gen_random_uuid(),
  "order_id"   UUID           NOT NULL,
  "product_id" UUID           NOT NULL,
  "quantity"   INTEGER        NOT NULL,
  "unit_price" DECIMAL(10, 2) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "quantity_positive" CHECK (quantity > 0),
  CONSTRAINT "order_items_order_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "order_items_product_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
  CONSTRAINT "order_items_order_product_unique"
    UNIQUE ("order_id", "product_id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx"
  ON "users" ("email");

CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_idx"
  ON "products" ("sku");

CREATE INDEX IF NOT EXISTS "orders_user_id_idx"
  ON "orders" ("user_id");

CREATE INDEX IF NOT EXISTS "orders_status_idx"
  ON "orders" ("status");

CREATE UNIQUE INDEX IF NOT EXISTS "order_items_order_product_idx"
  ON "order_items" ("order_id", "product_id");

COMMIT;
`;
