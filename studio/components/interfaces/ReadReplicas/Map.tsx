import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

import { BASE_PATH } from 'lib/constants'
import GeographyData from './data.json'

const MOCK_CREATED_REGIONS: {
  name: string
  coordinates: [number, number]
  key: string
  country: string
}[] = [
  { name: 'Primary', coordinates: [104, 1], key: 'SOUTHEAST_ASIA', country: 'Singapore' },
  { name: 'Replica #1', coordinates: [139, 36], key: 'NORTHEAST_ASIA', country: 'Tokyo' },
  { name: 'Replica #2', coordinates: [-100, 47], key: 'CENTRAL_CANADA', country: 'Canada' },
]

const AVAILABLE_REGIONS: {
  coordinates: [number, number]
  key: string
  country: string
}[] = [
  { coordinates: [104, 1], key: 'SOUTHEAST_ASIA', country: 'Singapore' },
  { coordinates: [139, 36], key: 'NORTHEAST_ASIA', country: 'Tokyo' },
  { coordinates: [128, 36], key: 'NORTHEAST_ASIA_2', country: 'Seoul' },
  { coordinates: [-120, 60], key: 'CENTRAL_CANADA', country: 'Canada' },
  { coordinates: [-120, 35], key: 'WEST_US', country: 'West US' },
  { coordinates: [-77, 35], key: 'EAST_US', country: 'East US' },
]

const Map = () => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; region: any }>()
  const undeployedRegions = AVAILABLE_REGIONS.filter(
    (region) => !MOCK_CREATED_REGIONS.map((x) => x.key).includes(region.key)
  )

  return (
    <div>
      <div className="bg-surface-300">
        <ComposableMap projectionConfig={{ scale: 130, center: [14, 13] }} height={280}>
          <Geographies geography={GeographyData}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  strokeWidth={0.3}
                  pointerEvents="none"
                  className="fill-scale-300 stroke-scale-400"
                />
              ))
            }
          </Geographies>
          {MOCK_CREATED_REGIONS.map((region) => (
            <Marker
              key={region.key}
              coordinates={region.coordinates}
              onMouseEnter={(event) => setTooltip({ x: event.clientX, y: event.clientY, region })}
              onMouseLeave={() => setTooltip(undefined)}
            >
              <circle
                r={3}
                className={`cursor-pointer ${
                  region.name === 'Primary' ? 'fill-brand' : 'fill-brand-500'
                }`}
              />
            </Marker>
          ))}
          {undeployedRegions.map((region) => (
            <Marker
              key={region.key}
              coordinates={region.coordinates}
              onMouseEnter={(event) => setTooltip({ x: event.clientX, y: event.clientY, region })}
              onMouseLeave={() => setTooltip(undefined)}
            >
              <circle r={3} className="cursor-pointer fill-scale-900" />
            </Marker>
          ))}
        </ComposableMap>

        {tooltip !== undefined && (
          <div
            className="absolute w-[200px] bg-black bg-opacity-50 rounded border"
            style={{ left: tooltip.x - 100, top: tooltip.y + 15 }}
          >
            <div className="px-3 py-2 flex items-center justify-between">
              <p
                className={`text-xs ${
                  tooltip.region.name === undefined ? 'text-foreground-light' : ''
                }`}
              >
                {tooltip.region.name ?? 'Not deployed'}
              </p>
              <div className="flex items-center justify-between space-x-2">
                <img
                  alt="region icon"
                  className="w-5 rounded-sm"
                  src={`${BASE_PATH}/img/regions/${tooltip.region.key}.svg`}
                />
                <p className="text-xs">{tooltip.region.country}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Map
