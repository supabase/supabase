import Link from 'next/link'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'community' | 'external' | 'soon'

export type GuideCardItem = {
  title: string
  description: ReactNode
  href?: string
  icon?: ReactNode
  iconColor?: string
  iconBg?: string
  badges?: { label: string; variant?: BadgeVariant }[]
  comingSoon?: boolean
}

type GuideCardGridProps = {
  items: GuideCardItem[]
  columnsClassName?: string
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: 'border-brand-500/50 text-brand',
  community: 'border-warning/40 text-warning',
  external: 'border-foreground/30 text-foreground-light',
  soon: 'border-foreground/20 text-foreground-light',
}

export function GuideCardGrid({ items, columnsClassName }: GuideCardGridProps) {
  const gridClasses = columnsClassName ?? 'md:grid-cols-2 xl:grid-cols-3'

  return (
    <div className={`grid gap-4 not-prose ${gridClasses}`}>
      {items.map((item) => {
        const CardWrapper = item.href && !item.comingSoon ? Link : 'div'
        const isLink = CardWrapper === Link
        const cardBody = (
          <div
            className="relative flex h-full flex-col gap-3 rounded-2xl border border-foreground/10 bg-surface-75/50 p-5 text-left transition duration-200 hover:border-foreground/30 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-disabled={!item.href || item.comingSoon}
          >
            <div className="flex items-center gap-3">
              {item.icon ? (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
                  style={
                    item.iconColor || item.iconBg
                      ? { color: item.iconColor, backgroundColor: item.iconBg }
                      : undefined
                  }
                >
                  {item.icon}
                </span>
              ) : null}
              <p className="text-base font-medium text-foreground">{item.title}</p>
            </div>
            <div className="text-sm text-foreground-light">{item.description}</div>
            {(item.badges?.length ?? 0) > 0 || item.comingSoon ? (
              <div className="mt-auto flex flex-wrap gap-2">
                {item.badges?.map((badge) => {
                  const variant = badge.variant ?? 'default'
                  return (
                    <span
                      key={`${item.title}-${badge.label}`}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[variant]}`}
                    >
                      {badge.label}
                    </span>
                  )
                })}
                {item.comingSoon ? (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES.soon}`}
                  >
                    Coming soon
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        )

        return isLink ? (
          <Link key={item.title} href={item.href!} className="col-span-1 block h-full">
            {cardBody}
          </Link>
        ) : (
          <div
            key={item.title}
            className="col-span-1 block h-full opacity-80"
            role="group"
            aria-disabled
          >
            {cardBody}
          </div>
        )
      })}
    </div>
  )
}
