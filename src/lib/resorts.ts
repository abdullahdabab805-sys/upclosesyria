// "Syria's summer resorts" hub (SEO day 19): /inside/resorts, Arabic only. One page for the intent
// "أجمل مصايف سوريا", built only from what the site already has: the countryside trips an editor tagged
// "مصيف" (dayTrips.tag), in the editors' order. Its only prose is an intro an editor writes in the site
// settings (siteSettings.resortsIntro); nothing on it is generated.
//
// Same rule as the "trips near a city" hubs (lib/nearby): indexed only with enough resorts AND a person's
// intro; otherwise noindex, out of the sitemap, llms.txt and IndexNow, and unlinked from public pages.
import { nearbyGate, type NearbyGate } from '@/lib/nearby'

export const RESORTS_PATH = '/inside/resorts'

/** The kind of place (dayTrips.tag) that puts a trip on the hub. */
export const RESORT_TAG = 'مصيف'

/** Trips the editors tagged as a resort, in their order. */
export function resortTrips<T extends { tag?: string | null }>(trips: readonly T[]): T[] {
  return trips.filter((t) => (t.tag ?? '').trim() === RESORT_TAG)
}

export type ResortsHub = { path: string; resorts: number } & NearbyGate

/** Whether the hub may be indexed and linked: the one rule for its metadata, sitemap, llms.txt, IndexNow and links. */
export function resortsHub(trips: readonly { tag?: string | null }[], intro: unknown): ResortsHub {
  const n = resortTrips(trips).length
  return { path: RESORTS_PATH, resorts: n, ...nearbyGate({ trips: n, intro }) }
}

/** The hub's title topic (the layout adds the site name). */
export const RESORTS_TOPIC = 'أجمل مصايف سوريا'
