import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "day_trips_asked_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  ALTER TABLE "day_trips_asked_questions" ADD CONSTRAINT "day_trips_asked_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."day_trips"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "day_trips_asked_questions_order_idx" ON "day_trips_asked_questions" USING btree ("_order");
  CREATE INDEX "day_trips_asked_questions_parent_id_idx" ON "day_trips_asked_questions" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "day_trips_asked_questions" CASCADE;`)
}
