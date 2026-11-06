// "Trips from a city" hub pages (SEO day 8): /inside/near/<city>, Arabic only. One page answers one
// intent ("مشاوير قريبة من دمشق"), built only from data the site already has: the city's countryside
// trips, their distance notes and the season reports from the city or its countryside. The page's only
// prose is an intro an editor writes in the CMS (cities.nearbyIntro); nothing on it is generated.
//
// A hub may be indexed only when it has enough to offer AND a person wrote its intro. Otherwise it is
// noindex, left out of the sitemap and IndexNow, and no public page links to it. Owner may change the
// threshold (decided on day 8 with the owner's blanket approval; see docs/seo/INTENT-MAP.md).

/** Fewest published trips from a city for its hub to be worth indexing. */
export const NEARBY_MIN_TRIPS = 3

/** Fewest characters of the editor's intro (a sentence, not a placeholder). */
export const NEARBY_MIN_INTRO = 80

export const NEARBY_PREFIX = '/inside/near/'

/** The hub's language-neutral path (Arabic only: lib/routing treats all of /inside as Arabic-only). */
export const nearbyPath = (citySlug: string) => `${NEARBY_PREFIX}${citySlug}`

/** The intro as it will be shown: trimmed, whitespace collapsed; empty when missing. */
export function cleanIntro(intro: unknown): string {
  return typeof intro === 'string' ? intro.replace(/\s+/g, ' ').trim() : ''
}

/** Characters as people count them (not UTF-16 units). */
const chars = (s: string) => [...s].length

export type NearbyGate = { indexable: boolean; reasons: ('few-trips' | 'no-intro' | 'short-intro')[] }

/** Why a hub is (not) indexable: the one rule used by its metadata, the sitemap, IndexNow and links. */
export function nearbyGate(o: { trips: number; intro: unknown }): NearbyGate {
  const intro = cleanIntro(o.intro)
  const reasons: NearbyGate['reasons'] = []
  if (o.trips < NEARBY_MIN_TRIPS) reasons.push('few-trips')
  if (!intro) reasons.push('no-intro')
  else if (chars(intro) < NEARBY_MIN_INTRO) reasons.push('short-intro')
  return { indexable: reasons.length === 0, reasons }
}

type Rel = number | { id: number } | null | undefined
const relId = (r: Rel): number | null => (r == null ? null : typeof r === 'number' ? r : r.id)

export type NearbyCity = { id: number; slug: string; parentCity?: Rel; nearbyIntro?: unknown }
export type NearbyTrip = { fromCity?: Rel }

export type NearbyHub = { cityId: number; slug: string; path: string; trips: number } & NearbyGate

/** One hub per main city that has at least one trip, in the cities' order. */
export function nearbyHubs(cities: readonly NearbyCity[], trips: readonly NearbyTrip[]): NearbyHub[] {
  const count = new Map<number, number>()
  for (const t of trips) {
    const id = relId(t.fromCity)
    if (id != null) count.set(id, (count.get(id) ?? 0) + 1)
  }
  return cities.flatMap((c) => {
    const n = count.get(c.id) ?? 0
    if (c.parentCity != null || n === 0) return []
    return [{ cityId: c.id, slug: c.slug, path: nearbyPath(c.slug), trips: n, ...nearbyGate({ trips: n, intro: c.nearbyIntro }) }]
  })
}

/** Paths of the hubs that may be indexed and linked. */
export const indexableNearbyPaths = (cities: readonly NearbyCity[], trips: readonly NearbyTrip[]) =>
  nearbyHubs(cities, trips)
    .filter((h) => h.indexable)
    .map((h) => h.path)

/** The city slug behind /inside/near/<slug>, or null. */
export function parseNearbySlug(slug: string): string | null {
  return /^[a-z0-9-]+$/.test(slug) ? slug : null
}

/** Title (topic only; the layout adds the site name) and the facts its description may state. */
export function nearbyTopic(cityName: string): string {
  return `مشاوير قريبة من ${cityName}`
}
