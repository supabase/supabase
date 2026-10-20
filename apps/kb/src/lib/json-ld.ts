// Canonical origin + base path from astro.config.mjs (`site` and `base`).
const KB_ORIGIN = 'https://supabase.com'
export const KB_BASE_URL = `${KB_ORIGIN}/kb`

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
}

// Guides carry no publish or modified dates in their frontmatter, so the
// schema omits them rather than inventing values.
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
