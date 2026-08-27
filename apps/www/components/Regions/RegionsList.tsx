'use client'

import { Badge, cn } from 'ui'

import { GROUPED_REGIONS } from './Regions.constants'

interface Props {
  selectedRegionCode: string | null
  hoveredRegionCode?: string
  onRegionHover: (code?: string) => void
  onRegionSelect: (code: string) => void
}

export const RegionsList = ({
  selectedRegionCode,
  hoveredRegionCode,
  onRegionHover,
  onRegionSelect,
}: Props) => (
  <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
    {GROUPED_REGIONS.map(({ group, regions }) => (
      <div key={group} className="flex flex-col gap-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-foreground-muted">
          {group}
        </h3>
        <ul className="flex flex-col divide-y divide-border-muted border-t border-border-muted">
          {regions.map((region) => {
            const isSelected = region.code === selectedRegionCode

            return (
              <li key={region.code}>
                <button
                  type="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => onRegionSelect(region.code)}
                  onMouseEnter={() => onRegionHover(region.code)}
                  onMouseLeave={() => onRegionHover(undefined)}
                  onFocus={() => onRegionHover(region.code)}
                  onBlur={() => onRegionHover(undefined)}
                  className={cn(
                    // Bleeds the hover background 8px each side so row content stays aligned with the heading
                    '-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-sm px-2 py-2.5 text-left transition-colors',
                    'hover:bg-surface-100 focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:outline-none',
                    isSelected && 'bg-surface-100',
                    !isSelected && region.code === hoveredRegionCode && 'bg-surface-100'
                  )}
                >
                  {/* Flags are SVGs, which next/image can't serve while dangerouslyAllowSVG is off */}
                  <img
                    alt=""
                    className="w-4 shrink-0 rounded-xs"
                    src={`/images/regions/${region.code}.svg`}
                  />
                  <span
                    className={cn(
                      'text-xs',
                      isSelected ? 'text-foreground' : 'text-foreground-light'
                    )}
                  >
                    {region.displayName}
                  </span>
                  {region.jurisdiction && <Badge>{region.jurisdiction}</Badge>}
                  <code className="ml-auto shrink-0 font-mono text-xs text-foreground-lighter">
                    {region.code}
                  </code>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    ))}
  </div>
)
