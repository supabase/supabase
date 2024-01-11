import { CloudProvider, PROVIDERS } from 'lib/constants'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Listbox } from 'ui'

import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { getAvailableRegions } from './ProjectCreation.utils'

interface RegionSelectorProps {
  cloudProvider: CloudProvider
  selectedRegion: string
  onSelectRegion: (value: string) => void
}

export const RegionSelector = ({
  cloudProvider,
  selectedRegion,
  onSelectRegion,
}: RegionSelectorProps) => {
  const router = useRouter()
  const availableRegions = getAvailableRegions(PROVIDERS[cloudProvider].id)
  const { data: region, isLoading, isSuccess } = useDefaultRegionQuery({ cloudProvider })

  useEffect(() => {
    if (isSuccess && region) onSelectRegion(region)
  }, [isSuccess, region])

  return (
    <Listbox
      layout="horizontal"
      label="Region"
      type="select"
      value={selectedRegion}
      disabled={isLoading}
      onChange={(value) => onSelectRegion(value)}
      descriptionText="Select the region closest to your users for the best performance."
    >
      <Listbox.Option disabled key="empty" label="---" value="">
        <span className="text-foreground">Select a region for your project</span>
      </Listbox.Option>
      {Object.keys(availableRegions).map((option: string, i) => {
        const label = Object.values(availableRegions)[i] as string
        return (
          <Listbox.Option
            key={option}
            label={label}
            value={label}
            addOnBefore={() => (
              <img
                alt="region icon"
                className="w-5 rounded-sm"
                src={`${router.basePath}/img/regions/${Object.keys(availableRegions)[i]}.svg`}
              />
            )}
          >
            <span className="text-foreground">{label}</span>
          </Listbox.Option>
        )
      })}
    </Listbox>
  )
}
