import { Axiom, Datadog, Grafana, Last9, Otlp, Sentry } from 'icons'
import { Braces, Cloud, Server } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { logDrainDestinationOptions, type LogDrainDestinationOption } from './LogDrainDestinationCards.data'

const ICONS: Record<LogDrainDestinationOption['iconKind'], ReactNode> = {
  braces: <Braces className="h-5 w-5" strokeWidth={1.5} />,
  otlp: <Otlp className="h-5 w-5" />,
  datadog: <Datadog className="h-5 w-5" />,
  grafana: <Grafana className="h-5 w-5" />,
  cloud: <Cloud className="h-5 w-5" strokeWidth={1.5} />,
  sentry: <Sentry className="h-5 w-5" />,
  axiom: <Axiom className="h-5 w-5" />,
  last9: <Last9 className="h-5 w-5" />,
  server: <Server className="h-5 w-5" strokeWidth={1.5} />,
}

export function LogDrainDestinationCards() {
  return (
    <div className="grid gap-4 not-prose md:grid-cols-3">
      {logDrainDestinationOptions.map((option) => (
        <Link key={option.href} href={option.href} className="col-span-1 block h-full">
          <div className="relative flex h-full flex-col gap-3 rounded-2xl border border-foreground/10 bg-surface-75/50 p-5 text-left transition duration-200 hover:border-foreground/30 hover:bg-surface-100">
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
          </div>
        </Link>
      ))}
    </div>
  )
}
