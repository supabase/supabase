import { remarkCodeHike, type CodeHikeConfig } from '@code-hike/mdx'
import { getCatalogPartner, listCatalogPartnerSlugs } from '~/lib/marketplaceDb'
import type { ListingDetail } from '~/types/partners'
import codeHikeTheme from 'config/code-hike.theme.json' with { type: 'json' }
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { serialize } from 'next-mdx-remote-client/serialize'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'
import remarkGfm from 'remark-gfm'

import PartnerCatalogDetail from './PartnerCatalogDetail'
import { canonicalAlternates } from '@/lib/canonical'

export const revalidate = 1800

type Params = { slug: string }

const getPartner = cache(
  unstable_cache(getCatalogPartner, ['partner-catalog-partner'], { revalidate })
)

const serializeListing = unstable_cache(
  async (source: string) => {
    const codeHikeOptions: CodeHikeConfig = {
      theme: codeHikeTheme,
      lineNumbers: true,
      showCopyButton: true,
      skipLanguages: [],
      autoImport: false,
    }
    const result = await serialize({
      source,
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm, [remarkCodeHike, codeHikeOptions]],
        },
      },
    })

    return 'error' in result
      ? { ...result, error: { name: result.error.name, message: result.error.message } }
      : result
  },
  ['partner-catalog-mdx', JSON.stringify(codeHikeTheme)],
  { revalidate }
)

export async function generateStaticParams() {
  const slugs = await listCatalogPartnerSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const partner = await getPartner(slug)
  if (!partner) return {}
  return {
    title: `${partner.title} | Works With Supabase`,
    description: partner.description,
    alternates: canonicalAlternates(`/partners/catalog/${encodeURIComponent(partner.slug)}`),
    openGraph: {
      title: `${partner.title} | Works With Supabase`,
      description: partner.description,
      url: `https://supabase.com/partners/catalog/${partner.slug}`,
      images: [{ url: partner.images?.[0] ?? partner.logo }],
    },
  }
}

export default async function PartnerCatalogPage({ params }: { params: Promise<Params> }) {
  await connection()
  const { slug } = await params
  const partner = await getPartner(slug)
  if (!partner) notFound()

  const listingsForTabs: ListingDetail[] = partner.listings?.length
    ? partner.listings
    : [
        {
          slug: partner.slug,
          label: 'Overview',
          publishedInMarketplace: false,
          content: partner.content,
          installUrl: partner.installUrl,
          docsUrl: partner.docsUrl,
          images: partner.images,
          youtubeId: partner.youtubeId,
        },
      ]

  const serializedListings = await Promise.all(
    listingsForTabs.map((listing) => serializeListing(listing.content))
  )

  return <PartnerCatalogDetail partner={partner} serializedListings={serializedListings} />
}
