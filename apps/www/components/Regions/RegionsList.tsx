'use client'

import { Badge, cn } from 'ui'

import { GROUPED_REGIONS } from './Regions.constants'

interface Props {
  activeRegionCode?: string
  onRegionHover: (code?: string) => void
}

export const RegionsList = ({ activeRegionCode, onRegionHover }: Props) => (
  <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
    {GROUPED_REGIONS.map(({ group, regions }) => (
      <div key={group} className="flex flex-col gap-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-foreground-muted">
          {group}
        </h3>
        <ul className="flex flex-col divide-y divide-border-muted border-t border-border-muted">
          {regions.map((region) => (
            <li
              key={region.code}
              onMouseEnter={() => onRegionHover(region.code)}
              onMouseLeave={() => onRegionHover(undefined)}
              className={cn(
                'flex items-center gap-3 px-2 py-2.5 -mx-2 transition-colors',
                activeRegionCode === region.code && 'bg-surface-100'
              )}
            >
              {/* Flags are SVGs, which next/image can't serve while dangerouslyAllowSVG is off */}
              <img
                alt=""
                className="w-4 shrink-0 rounded-xs"
                src={`/images/regions/${region.code}.svg`}
              />
              <span className="text-sm text-foreground">{region.displayName}</span>
              {region.jurisdiction && <Badge>{region.jurisdiction}</Badge>}
              <code className="ml-auto shrink-0 font-mono text-xs text-foreground-lighter">
                {region.code}
              </code>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)
