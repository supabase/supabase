import { cn, StatusIcon } from 'ui'

import { DestinationIcon } from './DestinationIcon'
import type { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { BASE_PATH } from '@/lib/constants'

type DestinationBrand = { type: 'mark'; src: string } | { type: 'monogram'; label: string }

const BRAND_BY_TYPE: Partial<Record<DestinationType, DestinationBrand>> = {
  BigQuery: { type: 'mark', src: `${BASE_PATH}/img/icons/bigquery-icon.svg` },
  ClickHouse: { type: 'monogram', label: 'CH' },
  DuckLake: { type: 'mark', src: `${BASE_PATH}/img/icons/ducklake-icon.svg` },
  Snowflake: { type: 'monogram', label: 'SF' },
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
  const sizing = SIZE_CLASS_NAME[size]
  const brand = BRAND_BY_TYPE[type]

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span className={cn('flex items-center justify-center border bg-surface-100', sizing.frame)}>
        {brand === undefined && (
          <DestinationIcon type={type} size={sizing.icon} className="text-foreground-light" />
        )}
        {brand?.type === 'mark' && (
          <img src={brand.src} alt="" aria-hidden className={sizing.mark} />
        )}
        {brand?.type === 'monogram' && (
          <span
            className={cn(
              'font-mono font-medium leading-none text-foreground-muted',
              size === 'small' ? 'text-xs' : 'text-lg'
            )}
            aria-hidden
          >
            {brand.label}
          </span>
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
