import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { ArrowDown } from 'lucide-react'
import { Button } from 'ui'

import { ExampleGallery } from '@/components/ExampleGallery'
import { EXAMPLES } from '@/data/registry'
import type { ExampleCategory, SupabaseFeature } from '@/data/types'
import { isExampleCategory, isSupabaseFeature } from '@/lib/filter-examples'

interface GallerySearch {
  q: string
  features: SupabaseFeature[]
  category?: ExampleCategory
}

function parseFeatures(value: unknown): SupabaseFeature[] {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  return items.filter(
    (item): item is SupabaseFeature => typeof item === 'string' && isSupabaseFeature(item)
  )
}

export const Route = createFileRoute('/_site/')({
  validateSearch: (search: {
    q?: unknown
    features?: unknown
    category?: unknown
  }): GallerySearch => ({
    q: typeof search.q === 'string' || typeof search.q === 'number' ? String(search.q) : '',
    features: parseFeatures(search.features),
    category:
      typeof search.category === 'string' && isExampleCategory(search.category)
        ? search.category
        : undefined,
  }),
  // Keep default values out of the URL.
  search: { middlewares: [stripSearchParams({ q: '', features: [] })] },
  component: HomePage,
})

function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b">
        <div className="section-container flex flex-col items-start gap-6 pb-16 pt-16 md:pt-24">
          <span className="rounded-md border bg-surface-75 px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-foreground-light">
            {EXAMPLES.length} example apps
          </span>
          <h1 className="max-w-4xl text-balance text-5xl leading-tight tracking-display md:text-6xl">
            If you can dream it, you can build it on Supabase.
          </h1>
          <p className="max-w-2xl text-xl text-foreground-light">
            Start from a real app. Try each one live, read the source, then deploy it or hand it to
            your coding agent and make it yours.
          </p>
          <div className="mt-2 flex gap-3">
            <Button asChild size="large" variant="primary" iconRight={<ArrowDown />}>
              <a href="#gallery">Browse examples</a>
            </Button>
            <Button asChild size="large" variant="default">
              <a href="https://supabase.com/docs" target="_blank" rel="noreferrer">
                Read the docs
              </a>
            </Button>
          </div>
        </div>
      </section>
      <ExampleGallery />
    </main>
  )
}
