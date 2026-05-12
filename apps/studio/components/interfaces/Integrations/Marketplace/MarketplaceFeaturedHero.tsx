import { ArrowRight, Pause, Settings } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, cn } from 'ui'

import { formatCategoryLabel, getMarketplaceTier } from './Marketplace.constants'
import { MarketplaceLogo } from './MarketplaceLogo'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const ROTATION_INTERVAL_MS = 7000

interface MarketplaceFeaturedHeroProps {
  integrations: IntegrationDefinition[]
  installedIds: string[]
  categoryOptions: Array<{ slug: string; name: string }>
}

// Splits the description into a short title (first sentence) and the rest of
// the body. Falls back to the full description for the title when no sentence
// break is found.
// const splitDescription = (description: string | null) => {
//   if (!description) return { title: '', body: '' }
//   const trimmed = description.trim()
//   const match = trimmed.match(/^(.+?[.!?])(\s+)(.*)$/s)
//   if (!match) return { title: trimmed, body: '' }
//   return { title: match[1].trim(), body: match[3].trim() }
// }

export const MarketplaceFeaturedHero = ({
  integrations,
  installedIds,
  categoryOptions,
}: MarketplaceFeaturedHeroProps) => {
  const { data: project } = useSelectedProjectQuery()

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
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

  const active = integrations[Math.min(activeIndex, integrations.length - 1)]
  const activeCategorySlug = active.categories?.[0]
  const activeCategoryName = activeCategorySlug
    ? formatCategoryLabel(activeCategorySlug, categoryOptions)
    : null
  const isActiveInstalled = installedIds.includes(active.id)
  // const { title, body } = splitDescription(active.description)

  const handleTabClick = (idx: number) => {
    setActiveIndex(idx)
  }

  return (
    <section>
      <div ref={cardRef} className="overflow-hidden rounded-lg border bg-surface-100">
        <div className="grid gap-0 @3xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="relative hidden @3xl:block">
            <FeaturedCover integration={active} categoryLabel={activeCategoryName} />
          </div>

          <div className="flex flex-col gap-4 p-5 @3xl:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MarketplaceLogo integration={active} size="h-7 w-7" />
                <span className="text-lg font-medium text-foreground">{active.name}</span>
                {active.status && (
                  <Badge variant="warning" className="capitalize">
                    {active.status}
                  </Badge>
                )}
                {getMarketplaceTier(active) === 'Partner' ? (
                  <Badge variant="success">Partner</Badge>
                ) : (
                  <Badge>Official</Badge>
                )}
                {isActiveInstalled && (
                  <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                    Installed
                  </Badge>
                )}
                {activeCategoryName && (
                  <span className="text-[12px] text-foreground-lighter">
                    · {activeCategoryName}
                  </span>
                )}
              </div>
            </div>

            <div className="grow flex flex-col gap-2">
              <p className="text-base text-foreground-light">{active.description}</p>
              {/* {title && (
                <h3 className="text-lg font-medium leading-snug text-foreground @3xl:text-xl">
                  {title}
                </h3>
              )}
              {body && <p className="text-[13px] leading-relaxed text-foreground-light">{body}</p>} */}
            </div>

            <div className="mt-1 flex items-center gap-4">
              <Button
                asChild
                type={isActiveInstalled ? 'outline' : 'default'}
                size="tiny"
                icon={isActiveInstalled ? <Settings size={13} /> : undefined}
              >
                <Link href={`/project/${project?.ref}/integrations/${active.id}/overview`}>
                  {isActiveInstalled ? 'Manage' : 'Install'}
                </Link>
              </Button>
              <Link
                href={`/project/${project?.ref}/integrations/${active.id}/overview`}
                className="flex items-center gap-1 text-[12.5px] text-foreground-light transition-colors hover:text-foreground"
              >
                Read more
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t @md:grid-cols-3 @3xl:grid-cols-5">
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
                <MarketplaceLogo integration={integration} size="h-7 w-7" />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      'truncate text-[12.5px] font-medium',
                      isActive ? 'text-foreground' : 'text-foreground-light'
                    )}
                  >
                    {integration.name}
                  </div>
                  {categoryLabel && (
                    <div className="truncate text-[11px] text-foreground-lighter">
                      {categoryLabel}
                    </div>
                  )}
                </div>
                {isActive && (
                  <span
                    key={activeIndex}
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
      <div className="mt-2 -mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          <h2 className="text-sm font-medium">Featured partners</h2> */}
        </div>
        <button
          type="button"
          onClick={() => setIsPaused((p) => !p)}
          className="flex items-center gap-1.5 p-1 text-[11px] text-foreground-lighter transition-colors hover:text-foreground-light"
          aria-label={isPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
        >
          {isPaused ? (
            <>
              <Pause size={10} />
              <span>Paused</span>
            </>
          ) : (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              <span>Auto Play</span>
            </>
          )}
        </button>
      </div>
    </section>
  )
}

interface FeaturedCoverProps {
  integration: IntegrationDefinition
  categoryLabel: string | null
}

// Decorative cover panel on the left of the hero. Uses a subtle dotted
// gradient and renders the integration's own icon at a large scale so each
// partner stays visually distinct without bespoke artwork per listing.
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
