CREATE TABLE "shortlists" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"talent_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_talent_id_users_id_fk" FOREIGN KEY ("talent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shortlists_client_talent_unique" ON "shortlists" USING btree ("client_id","talent_id");