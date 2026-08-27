'use client'

import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { cn } from 'ui'

import GeographyData from './MapData.json'
import { MAPPED_REGIONS } from './Regions.constants'

interface Props {
  activeRegionCode?: string
  onRegionHover: (code?: string) => void
}

export const RegionsMap = ({ activeRegionCode, onRegionHover }: Props) => {
  const activeRegion = MAPPED_REGIONS.find((region) => region.code === activeRegionCode)

  return (
    <ComposableMap projectionConfig={{ scale: 155 }} className="w-full h-full">
      <ZoomableGroup
        center={[14, 12]}
        zoom={1.3}
        // The map is a static illustration: no panning, no zooming
        filterZoomEvent={() => false}
      >
        <Geographies geography={GeographyData}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                strokeWidth={0.3}
                pointerEvents="none"
                className="fill-background-surface-300 stroke-border-strong"
              />
            ))
          }
        </Geographies>

        {MAPPED_REGIONS.map((region) => {
          const isActive = region.code === activeRegionCode

          return (
            <Marker
              key={region.key}
              coordinates={region.coordinates}
              onMouseEnter={() => onRegionHover(region.code)}
              onMouseLeave={() => onRegionHover(undefined)}
            >
              {isActive && <circle r={4} className="animate-ping fill-brand" />}
              <circle
                r={3.5}
                strokeWidth={1}
                className={cn(
                  'cursor-pointer transition-colors',
                  isActive ? 'fill-brand stroke-brand-500' : 'fill-brand-500 stroke-brand-400'
                )}
              />
            </Marker>
          )
        })}

        {activeRegion && (
          <Marker coordinates={activeRegion.coordinates}>
            <foreignObject x={-85} y={-46} width={170} height={40} className="pointer-events-none">
              <div className="flex items-center gap-2 rounded-md border bg-surface-100/90 px-2 py-1.5 backdrop-blur-xs">
                {/* Flags are SVGs, which next/image can't serve while dangerouslyAllowSVG is off */}
                <img
                  alt=""
                  className="w-4 rounded-xs"
                  src={`/images/regions/${activeRegion.code}.svg`}
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-foreground">{activeRegion.displayName}</span>
                  <span className="font-mono text-[9px] text-foreground-lighter">
                    {activeRegion.code}
                  </span>
                </div>
              </div>
            </foreignObject>
          </Marker>
        )}
      </ZoomableGroup>
    </ComposableMap>
  )
}
