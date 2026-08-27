'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

import { RegionsList } from './RegionsList'

const RegionsMap = dynamic(() => import('./RegionsMap').then((mod) => mod.RegionsMap), {
  ssr: false,
  loading: () => null,
})

export const RegionsExplorer = () => {
  const [activeRegionCode, setActiveRegionCode] = useState<string>()

  return (
    <div className="flex flex-col gap-8 lg:gap-12">
      <div className="relative h-[280px] w-full overflow-hidden rounded-lg border bg-alternative sm:h-[360px] lg:h-[540px]">
        <RegionsMap activeRegionCode={activeRegionCode} onRegionHover={setActiveRegionCode} />
      </div>
      <RegionsList activeRegionCode={activeRegionCode} onRegionHover={setActiveRegionCode} />
    </div>
  )
}
