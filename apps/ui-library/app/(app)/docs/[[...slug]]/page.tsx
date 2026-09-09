import '@/styles/code-block-variables.css'
import '@/styles/mdx.css'
import '@/styles/library-doc.css'

import { ArrowRight, Blocks } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Balancer from 'react-wrap-balancer'

import { allDocs } from '@/.velite'
import { metadata as mainMetadata } from '@/app/layout'
import { CopyDocPrompt } from '@/components/copy-doc-prompt'
import { FrameworkSelector } from '@/components/framework-selector'
import { Mdx } from '@/components/mdx-components'
import { SourcePanel } from '@/components/source-panel'
import { libraryBlocks } from '@/config/library'
import { getTableOfContents } from '@/lib/toc'
import { absoluteUrl, cn } from '@/lib/utils'

interface DocPageProps {
  params: Promise<{
    slug: string[]
  }>
}

async function getDocFromParams({ params }: { params: { slug: string[] } }) {
  const slug = params.slug?.join('/') || ''
  const doc = allDocs.find((doc) => doc.slugAsParams === slug)

  if (!doc) {
    return null
  }

  return doc
}

export async function generateMetadata(props: DocPageProps): Promise<Metadata> {
  const params = await props.params
  const doc = await getDocFromParams({ params })

  if (!doc) {
    return {}
  }

  const markdownPath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? '/library'}/docs/${doc.slugAsParams}.md`

  const metadata: Metadata = {
    ...mainMetadata,
    title: doc.title,
    description: doc.description,
    alternates: {
      types: {
        'text/markdown': `https://supabase.com${markdownPath}`,
      },
    },
    openGraph: {
      ...mainMetadata.openGraph,
      title: doc.title,
      description: doc.description,
      type: 'article',
      url: absoluteUrl(doc.slug),
    },
  }
  return metadata
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return allDocs.map((doc) => ({
    slug: doc.slugAsParams.split('/'),
  }))
}

export default async function DocPage(props: DocPageProps) {
  const params = await props.params
  const doc = await getDocFromParams({ params })

  if (!doc) {
    notFound()
  }

  const toc = await getTableOfContents(doc.raw)
  const isGuide = doc.slugAsParams.startsWith('getting-started/')
  const libraryBlock = libraryBlocks.find((block) => block.href === `/docs/${doc.slugAsParams}`)
  const markdownPath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? '/library'}/docs/${doc.slugAsParams}.md`
  const installation = toc.items?.find((item) =>
    ['Installation', 'Create the app'].includes(item.title)
  )

  return (
    <main className="isolate px-4 py-10 md:px-8 md:py-16">
      <header
        className={cn(
          'relative z-20 flex flex-col gap-6 py-8 md:py-12',
          isGuide ? 'mx-auto max-w-2xl items-start text-left' : 'items-center text-center'
        )}
      >
        {isGuide ? (
          <p className="text-xs text-foreground-lighter">
            {doc.slugAsParams === 'getting-started/faq' ? 'Docs' : 'Docs / Getting started'}
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-surface-75 px-2 text-xs text-foreground-light">
              <Blocks size={12} />
              Block
            </span>
            {libraryBlock?.frameworkLabel ? (
              <span className="inline-flex h-7 items-center rounded-md border bg-surface-75 px-2 text-xs text-foreground-light">
                {libraryBlock.frameworkLabel}
              </span>
            ) : (
              <FrameworkSelector />
            )}
          </div>
        )}
        <h1 className="max-w-2xl scroll-m-24 text-balance font-heading text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {doc.title}
        </h1>
        {doc.description && (
          <p
            className={cn(
              'max-w-xl text-foreground-light',
              isGuide ? 'text-sm leading-6' : 'font-heading text-xl font-semibold tracking-tight'
            )}
          >
            <Balancer>{doc.description}</Balancer>
          </p>
        )}
        {!isGuide && (
          <div className="mt-2 flex flex-col items-center gap-3">
            <CopyDocPrompt title={doc.title} markdownPath={markdownPath} />
            {installation && (
              <a
                href={installation.url}
                className="text-xs text-foreground-lighter underline-offset-4 hover:text-foreground hover:underline"
              >
                Or start with the commands below.
              </a>
            )}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-2xl">
        <SourcePanel doc={doc} />
      </div>
      <article className="library-doc-content relative z-0 min-w-0 pb-12">
        <Mdx code={doc.code} />
      </article>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="group flex w-full items-center justify-between border-t py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-left">
            <span className="block text-xs text-foreground-lighter">Explore next</span>
            <span className="mt-2 block text-sm">Browse all library blocks</span>
          </span>
          <ArrowRight
            size={16}
            className="text-foreground-lighter transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </main>
  )
}
