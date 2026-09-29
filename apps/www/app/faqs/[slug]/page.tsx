import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { SITE_ORIGIN } from '@/lib/constants'
import { parseFrontmatter } from '@/lib/frontmatter.mjs'
import { faqPageSchema, serializeJsonLd } from '@/lib/json-ld'
import { mdAlternates } from '@/lib/md-alternates'
import { getAllPostSlugs, getPostdata } from '@/lib/posts'

type Params = { slug: string }

type FaqFrontmatter = {
  title: string
  description: string
  date?: string
}

// Only slugs with a file in _faqs/ exist; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return getAllPostSlugs('_faqs').map((p) => ({ slug: p.params.slug }))
}

async function loadFaq(slug: string) {
  try {
    const raw = await getPostdata(slug, '_faqs')
    const { data, content } = parseFrontmatter(raw) as unknown as {
      data: FaqFrontmatter
      content: string
    }
    return { data, content }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const faq = await loadFaq(slug)
  if (!faq) return {}

  const url = `${SITE_ORIGIN}/faqs/${slug}`
  return {
    title: `${faq.data.title} | Supabase`,
    description: faq.data.description,
    alternates: { canonical: url, ...mdAlternates(`faqs/${slug}`) },
    openGraph: {
      title: faq.data.title,
      description: faq.data.description,
      url,
      type: 'article',
    },
  }
}

export default async function FaqPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const faq = await loadFaq(slug)
  if (!faq) notFound()

  const url = `${SITE_ORIGIN}/faqs/${slug}`
  const schema = faqPageSchema({
    url,
    question: faq.data.title,
    answer: faq.data.description,
  })

  return (
    <DefaultLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />
      <SectionContainerWithCn className="max-w-3xl">
        <article className="flex flex-col gap-6">
          <h1 className="text-foreground text-3xl sm:text-4xl">{faq.data.title}</h1>
          <div className="prose prose-docs max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{faq.content}</ReactMarkdown>
          </div>
        </article>
      </SectionContainerWithCn>
      <CTABanner />
    </DefaultLayout>
  )
}
