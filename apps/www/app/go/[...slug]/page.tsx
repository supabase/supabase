import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import GoPageRenderer from '@/components/Go/GoPageRenderer'
import { SITE_ORIGIN } from '@/lib/constants'
import { getAllGoSlugs, getGoPageBySlug } from '@/lib/go'

export const dynamic = 'force-static'

type Params = { slug: string[] }

function getSlugFromSegments(segments: string[]): string {
  return segments.join('/')
}

export async function generateStaticParams() {
  return getAllGoSlugs()
    .filter((slug) => slug.includes('/'))
    .map((slug) => ({ slug: slug.split('/') }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug: segments } = await params
  const slug = getSlugFromSegments(segments)
  const page = getGoPageBySlug(slug)

  if (!page) {
    return { title: 'Page Not Found' }
  }

  const { metadata } = page

  return {
    title: `${metadata.title} | Supabase`,
    description: metadata.description,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `${SITE_ORIGIN}/go/${page.slug}`,
      images: metadata.ogImage ? [{ url: metadata.ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: metadata.ogImage ? [metadata.ogImage] : undefined,
    },
    robots: metadata.noIndex ? { index: false, follow: false } : undefined,
  }
}

export default async function GoPage({ params }: { params: Promise<Params> }) {
  const { slug: segments } = await params
  const slug = getSlugFromSegments(segments)
  const page = getGoPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return <GoPageRenderer page={page} />
}
