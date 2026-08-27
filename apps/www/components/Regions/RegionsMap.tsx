'use client'

import { geoEqualEarth } from 'd3-geo'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { cn } from 'ui'

import GeographyData from './MapData.json'
import { MAPPED_REGIONS } from './Regions.constants'
import { RegionTooltip } from './RegionTooltip'

/**
 * The viewport is sized and framed so the land mass fills it edge to edge — the map is
 * letterboxed inside its container otherwise. At scale 155 the world (Antarctica is not in
 * MapData.json) projects to 828.3 x 361.5, so MAP_ZOOM shrinks it onto MAP_WIDTH and
 * MAP_CENTER is the coordinate at the middle of that bounding box.
 */
const MAP_SCALE = 155
const MAP_WIDTH = 800
const MAP_HEIGHT = 349
const MAP_ZOOM = 0.9659
const MAP_CENTER: [number, number] = [1.06, 6.89]

const projection = geoEqualEarth()
  .scale(MAP_SCALE)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
const [centerX, centerY] = projection(MAP_CENTER) ?? [MAP_WIDTH / 2, MAP_HEIGHT / 2]

/**
 * Where each marker sits as a percentage of the container, mirroring what ZoomableGroup does to
 * the SVG: `translate(width / 2 - centre * zoom) scale(zoom)`. The tooltip is positioned with
 * these because anything rendered inside the SVG scales with the viewBox — text ends up at half
 * size on a phone and twice that on a desktop.
 */
const REGION_POSITIONS = new Map(
  MAPPED_REGIONS.map((region) => {
    const [x, y] = projection(region.coordinates) ?? [centerX, centerY]

    return [
      region.code,
      {
        left: ((MAP_WIDTH / 2 + (x - centerX) * MAP_ZOOM) / MAP_WIDTH) * 100,
        top: ((MAP_HEIGHT / 2 + (y - centerY) * MAP_ZOOM) / MAP_HEIGHT) * 100,
      },
    ]
  })
)

interface Props {
  selectedRegionCode: string | null
  hoveredRegionCode?: string
  onRegionHover: (code?: string) => void
  onRegionSelect: (code: string) => void
  onRegionClear: () => void
}

export const RegionsMap = ({
  selectedRegionCode,
  hoveredRegionCode,
  onRegionHover,
  onRegionSelect,
  onRegionClear,
}: Props) => {
  // Hovering previews a region, so it wins over the selection
  const shownRegionCode = hoveredRegionCode ?? selectedRegionCode
  const shownRegion = MAPPED_REGIONS.find((region) => region.code === shownRegionCode)
  const shownPosition = shownRegion ? REGION_POSITIONS.get(shownRegion.code) : undefined
  // Markers in the right half of the map get their tooltip on the left, so it can't run off
  const isTooltipOnLeft = (shownPosition?.left ?? 0) > 50

  return (
    <>
      <ComposableMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        projectionConfig={{ scale: MAP_SCALE }}
        className="absolute inset-0 h-full w-full"
      >
        <ZoomableGroup
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          minZoom={MAP_ZOOM}
          maxZoom={MAP_ZOOM}
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
                  className="fill-foreground-muted/10 stroke-border-strong dark:fill-background-surface-300 dark:stroke-border-strong"
                />
              ))
            }
          </Geographies>

          {MAPPED_REGIONS.map((region) => {
            const isSelected = region.code === selectedRegionCode
            const isHighlighted = isSelected || region.code === hoveredRegionCode

            return (
              <Marker
                key={region.key}
                coordinates={region.coordinates}
                onMouseEnter={() => onRegionHover(region.code)}
                onMouseLeave={() => onRegionHover(undefined)}
                onClick={() => onRegionSelect(region.code)}
              >
                {isSelected && <circle r={4} className="animate-ping fill-brand" />}
                <circle
                  r={isHighlighted ? 4 : 3.5}
                  strokeWidth={1}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected
                      ? 'fill-brand-500 stroke-brand-600'
                      : isHighlighted
                        ? 'fill-brand stroke-brand-600'
                        : 'fill-brand-600 stroke-brand-400'
                  )}
                />
              </Marker>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>

      {shownRegion && shownPosition && (
        <div
          className="pointer-events-none absolute z-10 -translate-y-1/2"
          style={{
            // Anchored to the free side of the marker, capped at the space there is on that side
            // so a tooltip never runs past the edge, and kept a half-height clear of the top and
            // bottom edges
            ...(isTooltipOnLeft
              ? {
                  right: `calc(${100 - shownPosition.left}% + 0.625rem)`,
                  maxWidth: `calc(${shownPosition.left}% - 1rem)`,
                }
              : {
                  left: `calc(${shownPosition.left}% + 0.625rem)`,
                  maxWidth: `calc(${100 - shownPosition.left}% - 1rem)`,
                }),
            top: `clamp(1.125rem, ${shownPosition.top}%, calc(100% - 1.125rem))`,
          }}
        >
          <RegionTooltip
            region={shownRegion}
            isSelected={shownRegion.code === selectedRegionCode}
            onClear={onRegionClear}
          />
        </div>
      )}
    </>
  )
}
