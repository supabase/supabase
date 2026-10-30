type JsonLdSchema = Record<string, unknown> | Record<string, unknown>[]

// Escapes characters that could close the <script> tag or start an HTML entity.
export function serializeJsonLd(schema: JsonLdSchema): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Supabase',
  url: 'https://supabase.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://supabase.com/images/og/supabase-og.png',
  },
}

interface TechArticleSchemaInput {
  url: string
  headline: string
  description?: string
}

export function techArticleSchema({ url, headline, description }: TechArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${url}#page`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    headline,
    description,
    inLanguage: 'en',
    publisher: PUBLISHER,
  }
}

export interface BreadcrumbItem {
  name: string
  url: string
}

// Items are ordered from the root down to the current page.
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
