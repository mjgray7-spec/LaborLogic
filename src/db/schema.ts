import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invoices = pgTable(
  "invoices",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    vendorName: text("vendor_name"),
    invoiceNumber: text("invoice_number"),
    invoiceDate: timestamp("invoice_date"),
    vehicleId: text("vehicle_id"),
    vehicleMake: text("vehicle_make"),
    vehicleModel: text("vehicle_model"),
    vehicleYear: integer("vehicle_year"),
    odometerReading: integer("odometer_reading"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
    laborTotal: decimal("labor_total", { precision: 10, scale: 2 }),
    partsTotal: decimal("parts_total", { precision: 10, scale: 2 }),
    taxTotal: decimal("tax_total", { precision: 10, scale: 2 }),
    status: text("status").notNull().default("pending"),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    fileType: text("file_type"),
    parsedData: jsonb("parsed_data"),
    validationResults: jsonb("validation_results"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoices_user_id_idx").on(table.userId),
    index("invoices_status_idx").on(table.status),
  ]
);

export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    invoiceId: varchar("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
    laborCode: text("labor_code"),
    laborHours: decimal("labor_hours", { precision: 10, scale: 2 }),
    benchmarkRate: decimal("benchmark_rate", { precision: 10, scale: 2 }),
    benchmarkTime: decimal("benchmark_time", { precision: 10, scale: 2 }),
    variance: decimal("variance", { precision: 10, scale: 2 }),
    flagged: boolean("flagged").default(false),
    flagReason: text("flag_reason"),
  },
  (table) => [index("line_items_invoice_id_idx").on(table.invoiceId)]
);

export const vendors = pgTable(
  "vendors",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    totalInvoices: integer("total_invoices").default(0),
    averageVariance: decimal("average_variance", { precision: 10, scale: 2 }),
    flaggedInvoices: integer("flagged_invoices").default(0),
    totalSpend: decimal("total_spend", { precision: 10, scale: 2 }).default(
      "0"
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("vendors_user_id_idx").on(table.userId)]
);

export const validationRules = pgTable("validation_rules", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(),
  threshold: decimal("threshold", { precision: 10, scale: 2 }),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLineItemSchema = createInsertSchema(invoiceLineItems).omit({
  id: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
