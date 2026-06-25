import { Datadog, Grafana } from 'icons'
import { Flame } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { metricsStackOptions, type MetricsStackOption } from './MetricsStackCards.data'

const ICONS: Record<MetricsStackOption['iconKind'], ReactNode> = {
  grafana: <Grafana className="h-5 w-5" />,
  datadog: <Datadog className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" strokeWidth={1.5} />,
}

export function MetricsStackCards() {
  return (
    <div className="grid gap-4 not-prose md:grid-cols-2">
      {metricsStackOptions.map((option) => (
        <Link key={option.href} href={option.href} className="col-span-1 block h-full">
          <div className="relative flex h-full flex-col gap-4 rounded-2xl border border-foreground/10 bg-surface-75/50 p-5 text-left transition duration-200 hover:border-foreground/30 hover:bg-surface-100">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
                style={{ color: option.iconColor, backgroundColor: option.iconBg }}
              >
                {ICONS[option.iconKind]}
              </span>
              <p className="text-base font-medium text-foreground">{option.title}</p>
            </div>
            <div className="text-sm text-foreground-light">{option.description}</div>
            <div className="mt-auto flex flex-wrap gap-2">
              {option.badges.map((badge) => (
                <span
                  key={`${option.href}-${badge.label}`}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    badge.variant === 'community'
                      ? 'border-warning/40 text-warning'
                      : 'border-brand-500/50 text-brand'
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
