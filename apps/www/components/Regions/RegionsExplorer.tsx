'use client'

import dynamic from 'next/dynamic'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'
import { useState } from 'react'

import { REGION_CODES } from './Regions.constants'
import { RegionsList } from './RegionsList'

const RegionsMap = dynamic(() => import('./RegionsMap').then((mod) => mod.RegionsMap), {
  ssr: false,
  loading: () => null,
})

// Unknown values are dropped, so `?region=nonsense` renders as no selection
const regionParser = parseAsStringLiteral(REGION_CODES).withOptions({ history: 'push' })

const RegionsExplorerContent = () => {
  const [selectedRegionCode, setSelectedRegionCode] = useQueryState('region', regionParser)
  const [hoveredRegionCode, setHoveredRegionCode] = useState<string>()

  const handleRegionSelect = (code: string) =>
    setSelectedRegionCode(code === selectedRegionCode ? null : code)

  return (
    <div className="flex flex-col gap-8 lg:gap-12">
      {/* Matches the map's viewBox ratio, so the map fills the container instead of letterboxing */}
      <div className="relative aspect-800/349 w-full overflow-hidden rounded-lg border bg-alternative">
        <RegionsMap
          selectedRegionCode={selectedRegionCode}
          hoveredRegionCode={hoveredRegionCode}
          onRegionHover={setHoveredRegionCode}
          onRegionSelect={handleRegionSelect}
          onRegionClear={() => setSelectedRegionCode(null)}
        />
      </div>
      <RegionsList
        selectedRegionCode={selectedRegionCode}
        hoveredRegionCode={hoveredRegionCode}
        onRegionHover={setHoveredRegionCode}
        onRegionSelect={handleRegionSelect}
      />
    </div>
  )
}

export const RegionsExplorer = () => (
  <NuqsAdapter>
    <RegionsExplorerContent />
  </NuqsAdapter>
)
