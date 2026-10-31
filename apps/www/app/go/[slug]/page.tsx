import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import GoPageRenderer from '@/components/Go/GoPageRenderer'
import { SITE_ORIGIN } from '@/lib/constants'
import { getAllGoSlugs, getGoPageBySlug } from '@/lib/go'

export const revalidate = 30

type Params = { slug: string }

export async function generateStaticParams() {
  return getAllGoSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
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
  const { slug } = await params
  const page = getGoPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return <GoPageRenderer page={page} />
}
