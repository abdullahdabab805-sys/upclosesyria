import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// SEO day 8 (written 2026-11-06): cities.nearbyIntro, the editor's intro for /inside/near/<city> (lib/nearby).
// Dated before 20261029_120000_city_videos on purpose: that migration reads cities through the Payload API,
// which selects every column of the current schema, so on a fresh database this column must exist first.
// Databases that already ran city_videos simply run this one next (Payload runs pending migrations by name).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "cities" ADD COLUMN IF NOT EXISTS "nearby_intro" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "cities" DROP COLUMN IF EXISTS "nearby_intro";`)
}
