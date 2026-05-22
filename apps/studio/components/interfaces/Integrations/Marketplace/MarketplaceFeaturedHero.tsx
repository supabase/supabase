import { ArrowRight, Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, cn } from 'ui'

import { IntegrationLogo } from '../Integration/IntegrationLogo'
import {
  formatCategoryLabel,
  getMarketplaceSource,
  MarketplaceSourceBadge,
} from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const ROTATION_INTERVAL_MS = 7000
interface MarketplaceFeaturedHeroProps {
  integrations: IntegrationDefinition[]
  installedIds: string[]
  categoryOptions: Array<{ slug: string; name: string }>
}

export const MarketplaceFeaturedHero = ({
  integrations,
  installedIds,
  categoryOptions,
}: MarketplaceFeaturedHeroProps) => {
  const { data: project } = useSelectedProjectQuery()

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const hoveringRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (integrations.length <= 1) return
    if (isPaused) return

    const interval = setInterval(() => {
      if (hoveringRef.current) return
      setActiveIndex((idx) => (idx + 1) % integrations.length)
    }, ROTATION_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [integrations.length, isPaused])

  useEffect(() => {
    const node = cardRef.current
    if (!node) return
    const enter = () => {
      hoveringRef.current = true
    }
    const leave = () => {
      hoveringRef.current = false
    }
    node.addEventListener('pointerenter', enter)
    node.addEventListener('pointerleave', leave)
    return () => {
      node.removeEventListener('pointerenter', enter)
      node.removeEventListener('pointerleave', leave)
    }
  }, [])

  if (integrations.length === 0) return null

  const coverColSpan = integrations.length >= 6 ? 2 : 1

  const active = integrations[Math.min(activeIndex, integrations.length - 1)]
  const activeCategorySlug = active.categories?.[0]
  const activeCategoryName = activeCategorySlug
    ? formatCategoryLabel(activeCategorySlug, categoryOptions)
    : null
  const isActiveInstalled = installedIds.includes(active.id)
  const source = getMarketplaceSource(active)

  const handleTabClick = (idx: number) => {
    setActiveIndex(idx)
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm">Featured integrations</h2>
        </div>
        <Button
          aria-label={isPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
          type="default"
          size="tiny"
          className="px-1.5"
          icon={isPaused ? <Play size={10} /> : <Pause size={10} />}
          onClick={() =>
            setIsPaused((p) => {
              // When resuming, reset the progress animation so it starts from
              // zero and stays in sync with the fresh JS interval.
              if (p) setProgressKey((k) => k + 1)
              return !p
            })
          }
        />
      </div>
      <div
        ref={cardRef}
        className="overflow-hidden rounded-lg border bg-surface-100"
        style={
          {
            '--cover-width': `calc(${coverColSpan * 100}% / ${integrations.length})`,
          } as React.CSSProperties
        }
      >
        <Link
          href={`/project/${project?.ref}/integrations/${active.id}/overview`}
          className="grid gap-0 @3xl:grid-cols-[var(--cover-width)_minmax(0,1fr)] hover:bg-selection/20 transition-colors"
        >
          <div className="relative hidden @3xl:block">
            <FeaturedCover integration={active} categoryLabel={activeCategoryName} />
          </div>

          <div className="flex flex-col gap-4 p-5 @3xl:p-6">
            <div className="flex items-start @lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap flex-col @lg:flex-row @lg:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <IntegrationLogo integration={active} size="h-7 w-7" />
                    <span className="text-lg font-medium text-foreground">{active.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MarketplaceSourceBadge source={source} />
                    {active.status && <Badge variant="warning">{active.status}</Badge>}
                  </div>
                </div>
              </div>
              {isActiveInstalled && (
                <Badge variant="success" className="mt-2 @lg:mt-0 px-1.5 py-0 text-[10px]">
                  Installed
                </Badge>
              )}
            </div>

            <div className="grow flex flex-col gap-2">
              <p className="text-base text-foreground-light">{active.description}</p>
            </div>

            <div className="mt-1 flex items-center gap-4">
              <Button
                asChild
                type="text"
                className="p-0 pointer-events-none"
                iconRight={<ArrowRight size={12} />}
                size="tiny"
              >
                <Link href={`/project/${project?.ref}/integrations/${active.id}/overview`}>
                  {isActiveInstalled ? 'Manage integration' : 'View integration'}
                </Link>
              </Button>
            </div>
          </div>
        </Link>

        <div
          className="grid border-t"
          style={{ gridTemplateColumns: `repeat(${integrations.length}, minmax(0, 1fr))` }}
        >
          {integrations.map((integration, idx) => {
            const isActive = idx === activeIndex
            const slug = integration.categories?.[0]
            const categoryLabel = slug ? formatCategoryLabel(slug, categoryOptions) : null
            return (
              <button
                key={integration.id}
                type="button"
                onClick={() => handleTabClick(idx)}
                className={cn(
                  'group relative flex items-center gap-2.5 border-r p-3 text-left transition-colors last:border-r-0',
                  isActive ? 'bg-surface-200' : 'bg-transparent hover:bg-surface-200/60'
                )}
                aria-pressed={isActive}
              >
                <IntegrationLogo
                  integration={integration}
                  size="h-7 w-7"
                  className="hidden sm:flex"
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      'truncate text-sm',
                      isActive ? 'text-foreground' : 'text-foreground-light'
                    )}
                  >
                    {integration.name}
                  </div>
                  {categoryLabel && (
                    <div className="truncate text-xs text-foreground-lighter">{categoryLabel}</div>
                  )}
                </div>
                {isActive && (
                  <span
                    key={`${activeIndex}-${progressKey}`}
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left animate-marketplace-featured-progress bg-brand"
                    style={{
                      animationDuration: `${ROTATION_INTERVAL_MS}ms`,
                      animationPlayState: isPaused ? 'paused' : 'running',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

interface FeaturedCoverProps {
  integration: IntegrationDefinition
  categoryLabel: string | null
}

const FeaturedCover = ({ integration, categoryLabel }: FeaturedCoverProps) => (
  <div
    key={integration.id}
    className="relative h-full min-h-[200px] w-full overflow-hidden bg-linear-to-br from-surface-200 via-surface-100 to-surface-300"
  >
    <div
      aria-hidden
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, hsl(var(--border-default)/0.6) 1px, transparent 0)',
        backgroundSize: '14px 14px',
      }}
    />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm">
        {integration.icon({ className: 'h-16 w-16' })}
      </div>
    </div>
    {categoryLabel && (
      <span className="absolute bottom-3 left-3 text-[10px] font-medium uppercase tracking-wider text-foreground-lighter">
        {categoryLabel}
      </span>
    )}
  </div>
)
