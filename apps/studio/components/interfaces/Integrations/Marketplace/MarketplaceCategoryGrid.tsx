import { useParams } from 'common'
import Link from 'next/link'

import { getCategoryIcon } from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface CategoryWithCount {
  slug: string
  name: string
  count: number
}

interface MarketplaceCategoryGridProps {
  categories: Array<{ slug: string | null; name: string | null }>
  integrations: IntegrationDefinition[]
  /** Limit to N categories — defaults to 8 to match the design */
  limit?: number
}

export const MarketplaceCategoryGrid = ({
  categories,
  integrations,
  limit = 8,
}: MarketplaceCategoryGridProps) => {
  const { ref } = useParams()

  const withCounts: CategoryWithCount[] = categories
    .filter((c): c is { slug: string; name: string } => !!c.slug && !!c.name)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: integrations.filter((i) => i.categories?.includes(c.slug)).length,
    }))
    .filter((c) => c.count > 0)
    .slice(0, limit)

  if (withCounts.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">Browse by category</h2>
      <div className="grid grid-cols-2 gap-2.5 @2xl:grid-cols-3 @4xl:grid-cols-4">
        {withCounts.map((category) => {
          const Icon = getCategoryIcon(category.slug)
          return (
            <Link
              key={category.slug}
              href={`/project/${ref}/integrations?category=${category.slug}`}
              className="flex items-center gap-3 rounded-md border bg-surface-75 px-3.5 py-3 transition-colors hover:border-stronger hover:bg-surface-100"
            >
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-surface-200 text-foreground-light">
                <Icon size={15} />
              </span>
              <span>
                <span className="block text-[13px] font-medium">{category.name}</span>
                <span className="block text-[11.5px] text-foreground-lighter">
                  {category.count} integration{category.count === 1 ? '' : 's'}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
