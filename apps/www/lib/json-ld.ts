import type { PricingInformation } from 'shared-data/plans'

import { DEFAULT_META_DESCRIPTION, SITE_NAME } from './constants'

const CANONICAL_ORIGIN = 'https://supabase.com'
const ORG_ID = `${CANONICAL_ORIGIN}/#organization`
const SITE_ID = `${CANONICAL_ORIGIN}/#website`

const ORG_SAMEAS = [
  'https://github.com/supabase',
  'https://twitter.com/supabase',
  'https://www.linkedin.com/company/supabase',
  'https://youtube.com/c/supabase',
  'https://discord.supabase.com/',
  'https://www.tiktok.com/@supabase.com',
  'https://www.instagram.com/supabasecom',
]

const ORG_LOGO_URL = `${CANONICAL_ORIGIN}/images/og/supabase-og.png`

type JsonLdSchema = Record<string, unknown> | Record<string, unknown>[]

export function serializeJsonLd(schema: JsonLdSchema): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

interface OrganizationSchemaInput {
  description?: string
}

export function organizationSchema(input: OrganizationSchemaInput = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
    logo: {
      '@type': 'ImageObject',
      url: ORG_LOGO_URL,
    },
    description: input.description ?? DEFAULT_META_DESCRIPTION,
    sameAs: ORG_SAMEAS,
  }
}

interface WebSiteSchemaInput {
  description?: string
}

export function websiteSchema(input: WebSiteSchemaInput = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: CANONICAL_ORIGIN,
    name: SITE_NAME,
    description: input.description ?? DEFAULT_META_DESCRIPTION,
    publisher: { '@id': ORG_ID },
  }
}

interface SoftwareApplicationSchemaInput {
  name: string
  description: string
  url: string
  image: string
  applicationCategory?: string
}

export function softwareApplicationSchema(input: SoftwareApplicationSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    applicationCategory: input.applicationCategory ?? 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    publisher: { '@id': ORG_ID },
  }
}

interface BlogPostingSchemaInput {
  url: string
  headline: string
  description?: string
  image: string
  datePublished: string
  authors: Array<{ name: string; url?: string }>
}

export function blogPostingSchema(input: BlogPostingSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.url,
    },
    headline: input.headline,
    description: input.description,
    image: input.image,
    datePublished: input.datePublished,
    author: input.authors.map((a) => ({
      '@type': 'Person',
      name: a.name,
      ...(a.url ? { url: a.url } : {}),
    })),
    publisher: {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: ORG_LOGO_URL,
      },
    },
  }
}

interface FaqEntry {
  question: string
  answer: string
}

function markdownAnswerToText(markdown: string): string {
  return markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
}

export function faqPageSchema(entries: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: markdownAnswerToText(entry.answer),
      },
    })),
  }
}

interface PricingProductSchemaInput {
  plans: PricingInformation[]
  url: string
  description: string
  image: string
}

const PRICING_CURRENCY = 'USD'

function planToOffer(plan: PricingInformation & { priceMonthly: number }) {
  return {
    '@type': 'Offer',
    name: `${plan.name} Plan`,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: plan.priceMonthly.toFixed(2),
      priceCurrency: PRICING_CURRENCY,
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: 1,
        unitCode: 'MON',
      },
    },
    url: plan.href,
    availability: 'https://schema.org/InStock',
    category: plan.name,
    description: plan.description,
  }
}

export function pricingProductSchema(input: PricingProductSchemaInput) {
  const offers: ReturnType<typeof planToOffer>[] = []
  const customPlans: PricingInformation[] = []
  for (const plan of input.plans) {
    if (typeof plan.priceMonthly === 'number') {
      offers.push(planToOffer(plan as PricingInformation & { priceMonthly: number }))
    } else {
      customPlans.push(plan)
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Supabase',
    description: input.description,
    image: input.image,
    url: input.url,
    brand: { '@id': ORG_ID },
    offers,
    ...(customPlans.length > 0 && {
      additionalProperty: customPlans.map((plan) => ({
        '@type': 'PropertyValue',
        name: `${plan.name} Plan`,
        value: 'Contact for pricing',
        url: plan.href,
      })),
    }),
  }
}
