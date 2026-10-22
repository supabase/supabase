import { toIsoDay } from './format-date'

// Canonical origin + base path from astro.config.mjs (`site` and `base`).
const KB_ORIGIN = 'https://supabase.com'
export const KB_BASE_URL = `${KB_ORIGIN}/kb`

// Canonical URL for a rendered page, from `Astro.url.pathname`. Always on the production origin, even on preview
// deployments, and trailing slashes are dropped so the index and every other route share one form.
export function canonicalUrl(pathname: string): string {
  return new URL(pathname.replace(/\/+$/, '') || '/', KB_ORIGIN).href
}

type JsonLdSchema = Record<string, unknown> | Record<string, unknown>[]

export function serializeJsonLd(schema: JsonLdSchema): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

interface TechArticleSchemaInput {
  url: string
  headline: string
  description?: string
  dateModified?: Date
}

// Modified date is emitted as a calendar day (YYYY-MM-DD, UTC), matching the
// "Last edited" date shown on the page.
export function techArticleSchema(input: TechArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${input.url}#page`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.url,
    },
    url: input.url,
    headline: input.headline,
    description: input.description,
    dateModified: input.dateModified && toIsoDay(input.dateModified),
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: 'Supabase',
      url: KB_ORIGIN,
      logo: {
        '@type': 'ImageObject',
        url: `${KB_ORIGIN}/images/og/supabase-og.png`,
      },
    },
  }
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function breadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
