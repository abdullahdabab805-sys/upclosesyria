import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// SEO day 13: the creator's channel for VideoObject.creator.url (Search Console: "Missing field 'url'
// (in 'creator')"). The column is new and empty; the YouTube channels of the creators already on the
// site are filled from YouTube's oEmbed author_url, read on 2026-11-13 for one video of each. New and
// re-saved videos get theirs from the save hook (hooks/videoCreator.ts). Matched by the creator name as
// stored, YouTube rows only, and only where nothing is set yet.
const CHANNELS: ReadonlyArray<readonly [author: string, url: string]> = [
  ['Arab Diaries', 'https://www.youtube.com/@ArabDiaries'],
  ['Austin Davis Vlogs', 'https://www.youtube.com/@Austin_Davis2'],
  ['Jarid Boosters', 'https://www.youtube.com/@FRESHboosters'],
  ['Kirk79', 'https://www.youtube.com/@rrayess'],
  ['Rozana Media - روزنة للإعلام', 'https://www.youtube.com/@RozanaMedia'],
  ['Safartas', 'https://www.youtube.com/@safartas'],
  ['The Traveling ZAM', 'https://www.youtube.com/@thetravelingzam'],
  ['Traveling Solo Logs', 'https://www.youtube.com/@TravelingSoloLogs'],
  ['Yahya Khan', 'https://www.youtube.com/@yahyakhanfr'],
  ['rndomn8', 'https://www.youtube.com/@rndomn8'],
  ['وارف كاتبي - Waref Katbi', 'https://www.youtube.com/@waref_arabi_katbi'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "videos" ADD COLUMN "author_url" varchar;
  ALTER TABLE "_videos_v" ADD COLUMN "version_author_url" varchar;`)
  for (const [author, url] of CHANNELS) {
    await db.execute(sql`UPDATE "videos" SET "author_url" = ${url} WHERE "platform" = 'youtube' AND trim("author") = ${author} AND "author_url" IS NULL`)
    await db.execute(sql`UPDATE "_videos_v" SET "version_author_url" = ${url} WHERE "version_platform" = 'youtube' AND trim("version_author") = ${author} AND "version_author_url" IS NULL`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "videos" DROP COLUMN "author_url";
  ALTER TABLE "_videos_v" DROP COLUMN "version_author_url";`)
}
