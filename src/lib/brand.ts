import type { Locale } from '@/lib/i18n'

// The site's name, in one place (SEO day 9, ENTITY-AUDIT). Titles, Open Graph, the manifest, the
// schema.org WebSite/Organization, llms.txt and e-mails all read it from here, so the name search
// engines and AI assistants see never drifts between places.

export const BRAND = { ar: 'سوريا عن قرب', en: 'Syria Up Close' } as const

/** Both names together, Arabic first (manifest, llms.txt heading). */
export const BRAND_FULL = `${BRAND.ar} | ${BRAND.en}`

/** The public host, as readers type it (printed trip plans). */
export const BRAND_HOST = 'www.upclosesyria.com'

/**
 * WebSite/Organization alternateName, in order of preference (Google site names: an array is allowed;
 * the domain goes last and all lowercase). The domain reads "Up Close Syria", the reverse of the
 * English name, so both orders are listed for search engines to connect them.
 */
export const BRAND_ALTERNATES = [BRAND.en, 'Up Close Syria', 'upclosesyria.com'] as const

/** The one short description of the site (owner choice 2026-11-09). The footer keeps "not an official body". */
export const BRAND_DESCRIPTION = 'دليل سياحي مستقل عن سوريا كما هي اليوم: معلومات مؤرخة من مراسلين على الأرض، بالشراكة مع أهلين للإقامة.'

export const brandName = (locale: Locale) => BRAND[locale]
