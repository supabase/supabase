import { remarkCodeHike, type CodeHikeConfig } from '@code-hike/mdx'
import { getCatalogPartner, listCatalogPartnerSlugs } from '~/lib/marketplaceDb'
import type { ListingDetail } from '~/types/partners'
import codeHikeTheme from 'config/code-hike.theme.json' with { type: 'json' }
import type { Metadata } from 'next'
import { serialize } from 'next-mdx-remote-client/serialize'
import { notFound } from 'next/navigation'
import { cache, Suspense } from 'react'
import remarkGfm from 'remark-gfm'

import PartnerCatalogDetail from './PartnerCatalogDetail'

export const revalidate = 1800

type Params = { slug: string }

// Deduplicate the DB call across generateMetadata and the page component.
const getPartner = cache(getCatalogPartner)

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
    openGraph: {
      title: `${partner.title} | Works With Supabase`,
      description: partner.description,
      url: `https://supabase.com/partners/catalog/${partner.slug}`,
      images: [{ url: partner.images?.[0] ?? partner.logo }],
    },
  }
}

export default async function PartnerCatalogPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const partner = await getPartner(slug)
  if (!partner) notFound()

  const codeHikeOptions: CodeHikeConfig = {
    theme: codeHikeTheme,
    lineNumbers: true,
    showCopyButton: true,
    skipLanguages: [],
    autoImport: false,
  }

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
    listingsForTabs.map((listing) =>
      serialize({
        source: listing.content,
        options: {
          mdxOptions: {
            remarkPlugins: [remarkGfm, [remarkCodeHike, codeHikeOptions]],
          },
        },
      })
    )
  )

  return (
    <Suspense>
      <PartnerCatalogDetail partner={partner} serializedListings={serializedListings} />
    </Suspense>
  )
}
