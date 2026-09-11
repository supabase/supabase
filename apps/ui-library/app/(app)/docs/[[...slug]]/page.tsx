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

  const isGuide = doc.slugAsParams.startsWith('getting-started/')
  const isStarter = doc.slugAsParams.startsWith('starters/')
  const libraryBlock = libraryBlocks.find((block) => block.href === `/docs/${doc.slugAsParams}`)
  const markdownPath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? '/library'}/docs/${doc.slugAsParams}.md`

  return (
    <main className="isolate px-4 pb-10 pt-4 md:px-8 md:pb-16 md:pt-6">
      <header
        className={cn(
          'relative z-20 flex flex-col gap-6 py-8 md:py-12',
          isGuide ? 'mx-auto max-w-2xl items-start text-left' : 'items-center text-center'
        )}
      >
        {!isGuide && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-surface-75 px-2 text-xs text-foreground-light">
              <Blocks size={12} />
              {isStarter ? 'Starter' : 'Block'}
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
        <h1 className="max-w-2xl scroll-m-24 text-balance font-heading text-4xl font-normal leading-tight tracking-tight sm:text-5xl sm:leading-none">
          {doc.title}
        </h1>
        {doc.description && (
          <p className="max-w-xl text-balance text-lg text-foreground-muted">
            <Balancer>{doc.description}</Balancer>
          </p>
        )}
        {!isGuide && (
          <CopyDocPrompt
            title={doc.title}
            markdownPath={markdownPath}
            intent={isStarter ? 'create-app' : 'add-to-project'}
          />
        )}
      </header>

      <div className="mx-auto max-w-2xl">
        <SourcePanel doc={doc} />
      </div>
      {doc.preview && (
        <div className="library-doc-preview mx-auto max-w-5xl">
          <Mdx code={doc.preview} />
        </div>
      )}
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
