CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"talent_id" uuid NOT NULL,
	"pitch" text NOT NULL,
	"bid_amount" integer,
	"bid_type" text DEFAULT 'fixed' NOT NULL,
	"status" text DEFAULT 'applied' NOT NULL,
	"fit_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text DEFAULT '' NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"email_alerts" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_talent_id_users_id_fk" FOREIGN KEY ("talent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_opp_idx" ON "applications" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "applications_talent_idx" ON "applications" USING btree ("talent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_opp_talent_unique" ON "applications" USING btree ("opportunity_id","talent_id");