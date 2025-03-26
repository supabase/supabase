import { Mdx } from '@/components/mdx-components'
import { SourcePanel } from '@/components/source-panel'
import { DashboardTableOfContents } from '@/components/toc'
import { FrameworkSelector } from '@/components/framework-selector'
import { siteConfig } from '@/config/site'
import { componentPages, frameworkTitles } from '@/config/docs'
import { getTableOfContents } from '@/lib/toc'
import { absoluteUrl, cn } from '@/lib/utils'
import '@/styles/code-block-variables.css'
import '@/styles/mdx.css'
import { allDocs } from 'contentlayer/generated'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Balancer from 'react-wrap-balancer'
import { ScrollArea, Separator } from 'ui'

interface DocPageProps {
  params: {
    slug: string
  }
  searchParams: {
    framework?: string
  }
}

async function getDocFromParams({ params, searchParams }: DocPageProps) {
  const slug = params.slug || ''
  const framework = searchParams?.framework || 'nextjs'

  // Check if this is a component doc (which needs framework selection)
  const isComponentDoc = Object.keys(componentPages).includes(slug)

  if (isComponentDoc) {
    // For component docs, get content from the framework-specific MDX file
    const doc = allDocs.find((doc) => doc.slugAsParams === `${framework}/${slug}`)
    return doc || null
  }

  // For non-component docs (getting-started, etc.), use the direct path
  const doc = allDocs.find((doc) => doc.slugAsParams === slug)
  return doc || null
}

export async function generateMetadata({ params, searchParams }: DocPageProps): Promise<Metadata> {
  const doc = await getDocFromParams({ params, searchParams })

  if (!doc) {
    return {}
  }

  return {
    title: doc.title,
    description: doc.description,
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: 'article',
      url: absoluteUrl(doc.slug),
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.title,
      description: doc.description,
      images: [siteConfig.ogImage],
      creator: '@shadcn',
    },
  }
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Collect all unique slugs from component docs and regular docs
  const uniqueSlugs = new Set<string>([
    ...Object.keys(componentPages), // Component docs (dropzone, client, etc.)
    ...allDocs
      .map((doc) => doc.slugAsParams.split('/'))
      .filter((parts) => !Object.keys(frameworkTitles).includes(parts[0])) // Filter out framework docs
      .map((parts) => parts.join('/')), // Put back together any multi-part paths like getting-started/intro
  ])

  return Array.from(uniqueSlugs).map((slug) => ({ slug }))
}

export default async function DocPage({ params, searchParams }: DocPageProps) {
  const doc = await getDocFromParams({ params, searchParams })

  if (!doc) {
    notFound()
  }

  const toc = await getTableOfContents(doc.body.raw)
  const framework = searchParams?.framework || 'nextjs'
  const slug = params.slug || ''

  return (
    <main className="relative lg:gap-10 xl:grid xl:grid-cols-[1fr_200px] pr-6 lg:py-8">
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-foreground-muted">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap">Docs</div>
            <ChevronRight className="h-4 w-4 text-foreground-muted" />
            <div className="text-foreground-lighter">{doc.title}</div>
          </div>
        </div>
        <div className="flex items-end justify-between mb-5">
          <div className="space-y-2">
            <h1 className={cn('scroll-m-20 text-4xl tracking-tight')}>{doc.title}</h1>
            {doc.description && (
              <p className="text-lg text-foreground-light">
                <Balancer>{doc.description}</Balancer>
              </p>
            )}
          </div>
          <FrameworkSelector docTitle={slug} framework={framework} />
        </div>
        <Separator className="mb-6" />
        <SourcePanel doc={doc} />
        <div className="pb-12">
          <Mdx code={doc.body.code} />
        </div>
      </div>
      {doc.toc && (
        <div className="hidden text-sm xl:block">
          <div className="sticky top-16 -mt-10 pt-4">
            <ScrollArea className="pb-10">
              <div className="sticky top-16 -mt-10 h-[calc(100vh-3.5rem)] py-12">
                <DashboardTableOfContents toc={toc} />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </main>
  )
}
