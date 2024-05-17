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
  const {
    data: region,
    isSuccess,
    isError,
  } = useDefaultRegionQuery(
    { cloudProvider },
    { refetchOnMount: false, refetchOnWindowFocus: false, refetchInterval: false }
  )

  useEffect(() => {
    // only pick a region if one hasn't already been selected
    if (isSuccess && region && !selectedRegion) {
      onSelectRegion(region)
    } else if (isError && !selectedRegion) {
      // if an error happened, and the user haven't selected a region, just select the default one for him
      onSelectRegion(PROVIDERS[cloudProvider].default_region)
    }
  }, [cloudProvider, isError, isSuccess, region, selectedRegion])

  return (
    <Listbox
      layout="horizontal"
      label="Region"
      type="select"
      value={selectedRegion}
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
