'use client'

import type { ContentListingIcon } from '~/lib/content-listings.schema'
import {
  Auth,
  Axiom,
  Database,
  Datadog,
  EdgeFunctions,
  Grafana,
  Last9,
  Otlp,
  Realtime,
  Sentry,
  Storage,
} from 'icons'
import { BadgeCheck, Braces, Cloud, Server, Shield } from 'lucide-react'
import type { ReactNode } from 'react'

type IconKind = Extract<ContentListingIcon, { kind: string }>['kind']

const ICON_KIND_COMPONENTS: Record<IconKind, ReactNode> = {
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

const PRODUCT_ICONS = {
  database: Database,
  auth: Auth,
  rls: Shield,
  storage: Storage,
  functions: EdgeFunctions,
  realtime: Realtime,
  production: BadgeCheck,
} as const

export function resolveContentListingIcon(
  icon: ContentListingIcon | undefined
): ReactNode | string | undefined {
  if (typeof icon === 'string' && icon in PRODUCT_ICONS) {
    const Icon = PRODUCT_ICONS[icon as keyof typeof PRODUCT_ICONS]
    return <Icon className="h-5 w-5" strokeWidth={1.5} />
  }
  if (icon && typeof icon === 'object') {
    return (
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
        style={{ color: icon.color, backgroundColor: icon.bg }}
      >
        {ICON_KIND_COMPONENTS[icon.kind]}
      </span>
    )
  }
  // GlassPanel picks -light via next-themes; class-based dark: is more reliable for
  // Reflex (near-black light mark vanishes on dark cards if theme resolution lags).
  if (typeof icon === 'string' && icon.endsWith('/reflex-icon')) {
    return (
      <>
        <img src={`${icon}-light.svg`} alt="" className="w-5 dark:hidden" />
        <img src={`${icon}.svg`} alt="" className="w-5 hidden dark:block" />
      </>
    )
  }
  return icon
}
