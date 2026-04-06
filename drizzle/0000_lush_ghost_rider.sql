CREATE TABLE "invoice_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"item_type" text NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2),
	"unit_price" numeric(10, 2),
	"total_price" numeric(10, 2),
	"labor_code" text,
	"labor_hours" numeric(10, 2),
	"benchmark_rate" numeric(10, 2),
	"benchmark_time" numeric(10, 2),
	"variance" numeric(10, 2),
	"flagged" boolean DEFAULT false,
	"flag_reason" text
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"vendor_name" text,
	"invoice_number" text,
	"invoice_date" timestamp,
	"vehicle_id" text,
	"vehicle_make" text,
	"vehicle_model" text,
	"vehicle_year" integer,
	"odometer_reading" integer,
	"total_amount" numeric(10, 2),
	"labor_total" numeric(10, 2),
	"parts_total" numeric(10, 2),
	"tax_total" numeric(10, 2),
	"status" text DEFAULT 'pending' NOT NULL,
	"file_url" text,
	"file_name" text,
	"file_type" text,
	"parsed_data" jsonb,
	"validation_results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validation_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"rule_type" text NOT NULL,
	"threshold" numeric(10, 2),
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"total_invoices" integer DEFAULT 0,
	"average_variance" numeric(10, 2),
	"flagged_invoices" integer DEFAULT 0,
	"total_spend" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "line_items_invoice_id_idx" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_user_id_idx" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendors_user_id_idx" ON "vendors" USING btree ("user_id");