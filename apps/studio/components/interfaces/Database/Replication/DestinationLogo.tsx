import { cn } from 'ui'

import { DestinationIcon } from './DestinationIcon'
import type { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { BASE_PATH } from '@/lib/constants'

// Destinations with a brand mark. Anything absent falls back to the line icon in the same frame,
// so a new destination type never renders an empty square.
const BRAND_MARK_BY_TYPE: Partial<Record<DestinationType, string>> = {
  BigQuery: `${BASE_PATH}/img/icons/bigquery-icon.svg`,
}

const SIZE_CLASS_NAME = {
  small: { frame: 'h-8 w-8 rounded-md', mark: 'h-4 w-4', icon: 16 },
  large: { frame: 'h-14 w-14 rounded-lg', mark: 'h-6 w-6', icon: 24 },
} as const

interface DestinationLogoProps {
  type: DestinationType
  size?: keyof typeof SIZE_CLASS_NAME
  className?: string
}

/**
 * A destination's brand mark in a square app-icon frame, used wherever a destination is the
 * subject: the list rows, the pipeline header, and the replication diagram.
 */
export const DestinationLogo = ({ type, size = 'small', className }: DestinationLogoProps) => {
  const sizing = SIZE_CLASS_NAME[size]
  const brandMark = BRAND_MARK_BY_TYPE[type]

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center border bg-surface-100',
        sizing.frame,
        className
      )}
    >
      {brandMark === undefined ? (
        <DestinationIcon type={type} size={sizing.icon} className="text-foreground-light" />
      ) : (
        <img src={brandMark} alt="" aria-hidden className={sizing.mark} />
      )}
    </span>
  )
}
