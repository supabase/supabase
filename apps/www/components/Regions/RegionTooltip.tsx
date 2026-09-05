'use client'

import { X } from 'lucide-react'
import { Button } from 'ui'

import type { RegionDetails } from './Regions.constants'

interface Props {
  region: RegionDetails
  isSelected: boolean
  onClear: () => void
}

export const RegionTooltip = ({ region, isSelected, onClear }: Props) => (
  <div className="flex items-center gap-1.5 rounded-md border bg-surface-100/95 px-1.5 py-1 shadow-xs backdrop-blur-sm">
    {/* Flags are SVGs, which next/image can't serve while dangerouslyAllowSVG is off */}
    <img alt="" className="w-3.5 shrink-0 rounded-xs" src={`/images/regions/${region.code}.svg`} />
    <div className="flex min-w-0 flex-col leading-tight">
      <span className="truncate text-[11px] text-foreground">{region.displayName}</span>
      <span className="truncate font-mono text-[10px] text-foreground-lighter">{region.code}</span>
    </div>
    {isSelected && (
      <Button
        variant="text"
        size="tiny"
        icon={<X size={12} />}
        onClick={onClear}
        aria-label="Clear selected region"
        className="pointer-events-auto ml-0.5 h-4 w-4 p-0"
      />
    )}
  </div>
)
