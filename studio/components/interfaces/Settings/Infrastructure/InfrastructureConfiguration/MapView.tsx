import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

import GeographyData from './MapData.json'
import { BASE_PATH } from 'lib/constants'
import {
  MOCK_AVAILABLE_REPLICA_REGIONS,
  MOCK_CREATED_REGIONS,
} from './InstanceConfiguration.constants'

const MapView = () => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; region: any }>()
  const undeployedRegions = MOCK_AVAILABLE_REPLICA_REGIONS.filter(
    (region) => !MOCK_CREATED_REGIONS.map((x) => x.key).includes(region.key)
  )

  return (
    <div className="bg-background">
      <ComposableMap projectionConfig={{ scale: 140, center: [14, 7] }} height={354}>
        <Geographies geography={GeographyData}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                strokeWidth={0.3}
                pointerEvents="none"
                className="fill-gray-300 stroke-gray-200"
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
              r={4}
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
            <circle r={4} className="cursor-pointer fill-scale-900" />
          </Marker>
        ))}
      </ComposableMap>

      {tooltip !== undefined && (
        <div
          className="absolute w-[200px] bg-black bg-opacity-50 rounded border"
          style={{ left: tooltip.x - 410, top: tooltip.y - 130 }}
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
  )
}

export default MapView
