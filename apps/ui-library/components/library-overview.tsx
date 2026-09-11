'use client'

import { ArrowUpRight, Box } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, cn } from 'ui'

import { CatalogPreview } from '@/components/catalog-preview'
import {
  getLibraryBlockHref,
  libraryBlocks,
  libraryCategories,
  type LibraryBlock,
} from '@/config/library'
import { useFramework } from '@/context/framework-context'

function LibraryCard({ block, framework }: { block: LibraryBlock; framework: string }) {
  return (
    <Link
      href={getLibraryBlockHref(block, framework)}
      className="group flex w-full min-w-0 flex-col gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
    >
      <div className="aspect-[4/3] overflow-hidden rounded-md border bg-surface-75 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:20px_20px] transition-colors group-hover:border-stronger group-focus-visible:border-stronger">
        <div className="h-full w-full grayscale transition-[filter] duration-200 group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none">
          <CatalogPreview kind={block.preview} />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-1 pb-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-sm font-medium tracking-tight">{block.title}</h3>
          <span className="flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] leading-3 text-foreground-light">
            <Box className="size-2.5" />
            Block
          </span>
        </div>
        <p className="max-w-sm text-sm leading-5 text-foreground-lighter">{block.description}</p>
        {block.external && (
          <span className="flex items-center gap-1 text-xs text-foreground-lighter">
            View starter on GitHub
            <ArrowUpRight className="size-3" />
          </span>
        )}
      </div>
    </Link>
  )
}

export function LibraryOverview() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category')
  const activeCategory =
    libraryCategories.find((category) => category.name === selectedCategory)?.name ?? 'All'
  const { framework } = useFramework()

  const filtered = libraryBlocks.filter(
    (block) => activeCategory === 'All' || block.category === activeCategory
  )
  const sections = libraryCategories
    .map((category) => ({
      ...category,
      items: filtered.filter((block) => block.category === category.name),
    }))
    .filter((section) => section.items.length > 0)

  function selectCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'All') params.delete('category')
    else params.set('category', category)
    router.replace(params.size ? `/?${params}` : '/', { scroll: false })
  }

  return (
    <main>
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-10 pt-16 md:px-8 md:pb-12 md:pt-24">
        <h1 className="max-w-2xl text-balance font-heading text-4xl font-normal tracking-normal sm:text-5xl sm:leading-none">
          Building blocks for your next backend.
        </h1>
      </section>

      <section
        className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-16 md:px-8 md:pb-24"
        aria-labelledby="catalog-heading"
      >
        <h2 id="catalog-heading" className="sr-only">
          Browse blocks
        </h2>
        <div className="flex flex-col gap-3 border-b pb-12">
          <span id="category-label" className="text-xs font-medium text-foreground-lighter">
            Category
          </span>
          <div
            role="group"
            aria-labelledby="category-label"
            className="grid w-fit max-w-full grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3"
          >
            {['All', ...libraryCategories.map((category) => category.name)].map((category) => (
              <Button
                key={category}
                variant="text"
                aria-pressed={activeCategory === category}
                onClick={() => selectCategory(category)}
                className={cn(
                  'h-auto min-w-0 justify-start rounded-sm border-0 p-0 text-left text-sm leading-6 hover:bg-transparent hover:text-foreground',
                  activeCategory === category ? 'text-foreground' : 'text-foreground-light'
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <p className="sr-only" role="status">
          {filtered.length} blocks found
        </p>
        {sections.length > 0 ? (
          <div className="flex flex-col gap-12">
            {sections.map((section) => (
              <section
                key={section.slug}
                id={section.slug}
                aria-labelledby={`${section.slug}-heading`}
                className="flex flex-col gap-8"
              >
                <div className="flex flex-col gap-0">
                  <h2 id={`${section.slug}-heading`} className="text-lg text-foreground">
                    {section.name}
                  </h2>
                  <p className="text-lg text-foreground-muted">{section.description}</p>
                </div>
                <div className="flex flex-wrap gap-6">
                  {section.items.map((block) => (
                    <LibraryCard key={block.slug} block={block} framework={framework} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium">No blocks found</p>
            <p className="text-lg text-foreground-muted">Try another category.</p>
            <Button
              variant="default"
              className="mt-3"
              onClick={() => {
                selectCategory('All')
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <div className="flex flex-col justify-between gap-5 border-t pt-8 sm:flex-row sm:items-center">
          <p className="max-w-xl text-lg text-foreground-muted">
            Components, blocks, and starter apps for Supabase. Add blocks to your project with a
            single command.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="default">
              <Link href="/docs/getting-started/quickstart">Get started</Link>
            </Button>
            <Button asChild variant="text" iconRight={<ArrowUpRight className="size-3.5" />}>
              <a href="https://supabase.com/docs/guides/ai-tools/ai-skills">Install skills</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
