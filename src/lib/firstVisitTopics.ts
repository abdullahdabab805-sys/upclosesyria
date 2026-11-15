// The five first-visit topics, in display order, with the prototype's titles and summaries (FIRSTVISIT).
// Used by the seed (initial drafts) and by /outside for topics that are not published yet.

export type FirstVisitTopic = 'visa' | 'arrival' | 'money' | 'connectivity' | 'transport'
type L = { ar: string; en: string }

/**
 * Search titles (<title>, Open Graph), separate from the on-page heading the editors set. SEO day 15: people
 * search "syria visa", "تأشيرة سوريا"; a title without the country's name ("Visa & entry") never matches.
 */
export const FIRST_VISIT_SEO_TITLE: Record<FirstVisitTopic, L> = {
  visa: { ar: 'تأشيرة سوريا وشروط الدخول', en: 'Syria visa and entry requirements' },
  arrival: { ar: 'الوصول إلى سوريا: المطارات والمعابر البرية', en: 'Getting to Syria: airports and land borders' },
  money: { ar: 'المال في سوريا: العملة والصرافة والبطاقات', en: 'Money in Syria: currency, cash and cards' },
  connectivity: { ar: 'الاتصالات في سوريا: شرائح وإنترنت وتطبيقات', en: 'Staying connected in Syria: SIMs and data' },
  transport: { ar: 'التنقل في سوريا: باصات وتكاسي وسيارات', en: 'Getting around Syria: buses, taxis and cars' },
}

export const FIRST_VISIT: { topic: FirstVisitTopic; title: L; summary: L }[] = [
  { topic: 'visa', title: { ar: 'التأشيرة والدخول', en: 'Visa & entry' }, summary: { ar: 'أنواع التأشيرة ومن يحتاجها، والوثائق المطلوبة.', en: 'Visa types, who needs one, required documents.' } },
  { topic: 'arrival', title: { ar: 'الوصول', en: 'Getting there' }, summary: { ar: 'المطارات والمعابر البرية، ومن بيروت وعمّان.', en: 'Airports and land crossings, from Beirut and Amman.' } },
  { topic: 'money', title: { ar: 'المال', en: 'Money' }, summary: { ar: 'العملة والصرافة والدفع والبطاقات.', en: 'Currency, exchange, cash and cards.' } },
  { topic: 'connectivity', title: { ar: 'الاتصالات', en: 'Staying connected' }, summary: { ar: 'شرائح الهاتف والإنترنت والتطبيقات.', en: 'SIM cards, data and apps.' } },
  { topic: 'transport', title: { ar: 'التنقل', en: 'Getting around' }, summary: { ar: 'بين المدن وداخلها: باصات، تكاسي، سيارات.', en: 'Between and within cities: buses, taxis, cars.' } },
]
