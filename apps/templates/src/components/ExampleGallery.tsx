import { getRouteApi } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { Button, cn } from 'ui'

import { ExampleCard } from './ExampleCard'
import { FeatureIcon } from './FeatureBadge'
import { EXAMPLES } from '@/data/registry'
import {
  EXAMPLE_CATEGORIES,
  SUPABASE_FEATURES,
  type ExampleCategory,
  type SupabaseFeature,
} from '@/data/types'
import { countByFeature, filterExamples, usedCategories, usedFeatures } from '@/lib/filter-examples'

const route = getRouteApi('/_site/')

const FEATURE_COUNTS = countByFeature(EXAMPLES)
// Only offer filters that match at least one example.
const CATEGORIES = usedCategories(EXAMPLES)
const FEATURES = usedFeatures(EXAMPLES)

export function ExampleGallery() {
  const { q, features, category } = route.useSearch()
  const navigate = route.useNavigate()

  const results = filterExamples(EXAMPLES, { query: q, features, category })
  const hasFilters = q !== '' || features.length > 0 || category !== undefined

  const toggleFeature = (feature: SupabaseFeature) => {
    const next = features.includes(feature)
      ? features.filter((item) => item !== feature)
      : [...features, feature]
    navigate({ search: (prev) => ({ ...prev, features: next }), replace: true })
  }

  const setCategory = (next?: ExampleCategory) => {
    navigate({ search: (prev) => ({ ...prev, category: next }), replace: true })
  }

  const clearFilters = () => navigate({ search: { q: '', features: [] }, replace: true })

  return (
    <section id="gallery" className="section-container pb-24">
      <div className="sticky top-(--header-height) z-30 -mx-6 border-b bg-background/90 px-6 py-4 backdrop-blur-xs dark:bg-background/95">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-lighter" />
              <input
                type="search"
                value={q}
                onChange={(event) =>
                  navigate({
                    search: (prev) => ({ ...prev, q: event.target.value }),
                    replace: true,
                  })
                }
                placeholder="Search examples, frameworks, features…"
                aria-label="Search examples"
                className="h-10 w-full rounded-lg border bg-surface-100 pl-9 pr-3 text-sm transition-colors placeholder:text-foreground-muted focus:border-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-muted/40"
              />
            </div>
            <div
              className="flex gap-1 overflow-x-auto md:ml-auto"
              role="group"
              aria-label="Category"
            >
              <CategoryTab isActive={category === undefined} onClick={() => setCategory(undefined)}>
                All
              </CategoryTab>
              {CATEGORIES.map((key) => (
                <CategoryTab key={key} isActive={category === key} onClick={() => setCategory(key)}>
                  {EXAMPLE_CATEGORIES[key]}
                </CategoryTab>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FEATURES.map((feature) => {
              const isSelected = features.includes(feature)
              return (
                <button
                  tabIndex={0}
                  key={feature}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleFeature(feature)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm transition-colors',
                    isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : 'text-foreground-light hover:border-strong hover:text-foreground'
                  )}
                >
                  <FeatureIcon feature={feature} className="size-3.5" />
                  {SUPABASE_FEATURES[feature].label}
                  <span className="text-xs opacity-60">{FEATURE_COUNTS[feature]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-6 text-sm text-foreground-light">
        <span aria-live="polite">
          {results.length} {results.length === 1 ? 'example' : 'examples'}
        </span>
        {hasFilters && (
          <Button variant="text" icon={<X />} onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((example) => (
            <ExampleCard key={example.slug} example={example} />
          ))}
        </div>
      )}

      {results.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-24 text-center">
          <p className="text-lg font-medium">No examples match</p>
          <p className="max-w-sm text-sm text-foreground-light">
            Try removing a feature or searching for something broader.
          </p>
          <Button variant="default" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </section>
  )
}

function CategoryTab({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      tabIndex={0}
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors',
        isActive ? 'bg-surface-300 text-foreground' : 'text-foreground-light hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}
