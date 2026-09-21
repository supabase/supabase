import { useTheme } from 'next-themes'
import { cn, StatusIcon } from 'ui'

import { DestinationIcon } from './DestinationIcon'
import type { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { BRAND_ICONS, resolveThemedIconSrc, type ThemedIconSrc } from '@/lib/brand-icons'
import { resolveThemeOverrideMode } from '@/lib/theme-overrides'

// Destinations with a brand mark. Anything absent falls back to the line icon in the same frame,
// so a new destination type never renders an empty square. Paths are shared with Wrappers via
// BRAND_ICONS; light/dark is optional (BigQuery is a single asset).
const BRAND_MARK_BY_TYPE: Partial<Record<DestinationType, ThemedIconSrc>> = {
  BigQuery: BRAND_ICONS.bigquery,
  ClickHouse: BRAND_ICONS.clickhouse,
  DuckLake: BRAND_ICONS.ducklake,
  Snowflake: BRAND_ICONS.snowflake,
}

const SIZE_CLASS_NAME = {
  small: { frame: 'h-8 w-8 rounded-md', mark: 'h-4 w-4', icon: 16 },
  large: { frame: 'h-14 w-14 rounded-lg', mark: 'h-8 w-8', icon: 32 },
} as const

interface DestinationLogoProps {
  type: DestinationType
  size?: keyof typeof SIZE_CLASS_NAME
  className?: string
  /** Destructive badge on the bottom-right corner (e.g. table replication errors). */
  hasErrors?: boolean
}

/**
 * A destination's brand mark in a square app-icon frame, used wherever a destination is the
 * subject: the list rows, the pipeline header, and the replication diagram.
 */
export const DestinationLogo = ({
  type,
  size = 'small',
  className,
  hasErrors = false,
}: DestinationLogoProps) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolveThemeOverrideMode(resolvedTheme) === 'dark'
  const sizing = SIZE_CLASS_NAME[size]
  const brandMark = BRAND_MARK_BY_TYPE[type]
  const brandMarkSrc = brandMark === undefined ? undefined : resolveThemedIconSrc(brandMark, isDark)

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span className={cn('flex items-center justify-center border bg-surface-100', sizing.frame)}>
        {brandMarkSrc === undefined ? (
          <DestinationIcon type={type} size={sizing.icon} className="text-foreground-light" />
        ) : (
          <img src={brandMarkSrc} alt="" aria-hidden className={sizing.mark} />
        )}
      </span>
      {hasErrors && (
        <span
          className="absolute -bottom-1 -right-1 rounded-sm bg-background outline outline-2 outline-background"
          aria-hidden
        >
          <StatusIcon variant="destructive" />
        </span>
      )}
    </span>
  )
}
