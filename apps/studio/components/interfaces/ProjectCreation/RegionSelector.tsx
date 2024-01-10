import { CloudProvider, PROVIDERS } from 'lib/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { IconLoader, Listbox } from 'ui'

import { getDistanceLatLonKM } from 'lib/helpers'
import {
  AWS_REGIONS_LAT_LON,
  COUNTRY_LAT_LON,
  FLY_REGIONS_LAT_LON,
} from './ProjectCreation.constants'
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
  const [retrievingLocation, setRetrievingLocation] = useState(false)

  const availableRegions = getAvailableRegions(PROVIDERS[cloudProvider].id)
  const locations = cloudProvider === 'AWS' ? AWS_REGIONS_LAT_LON : FLY_REGIONS_LAT_LON

  async function getClosestRegion() {
    setRetrievingLocation(true)

    try {
      const data = await fetch('https://www.cloudflare.com/cdn-cgi/trace').then((res) => res.text())
      const locationCode: keyof typeof COUNTRY_LAT_LON = Object.fromEntries(
        data.split('\n').map((item) => item.split('='))
      )['loc']
      const locLatLon = COUNTRY_LAT_LON[locationCode]

      if (locLatLon !== undefined) {
        const distances = Object.keys(locations).map((reg) => {
          const region: { lat: number; lon: number } = locations[reg as keyof typeof locations]
          return getDistanceLatLonKM(locLatLon.lat, locLatLon.lon, region.lat, region.lon)
        })
        const shortestDistance = Math.min(...distances)
        const closestRegion = Object.keys(locations)[distances.indexOf(shortestDistance)]
        onSelectRegion(closestRegion)
        toast.success(`Selected ${closestRegion} as the region closest to your location`)
        setRetrievingLocation(false)
      } else {
        throw new Error()
      }
    } catch (error) {
      toast.error('Unable to retrieve your current location')
    }
  }

  return (
    <Listbox
      layout="horizontal"
      label="Region"
      type="select"
      value={selectedRegion}
      onChange={(value) => onSelectRegion(value)}
      descriptionText={
        <div>
          <p>
            Select the region closest to your users for the best performance. You may also{' '}
            <span
              className="text-brand opacity-50 underline hover:opacity-100 transition cursor-pointer relative"
              onClick={getClosestRegion}
            >
              select the region closest to your location.
              {retrievingLocation && (
                <IconLoader
                  className="absolute top-0.5 -right-5 text-foreground animate-spin"
                  size={14}
                  strokeWidth={2}
                />
              )}
            </span>
          </p>
        </div>
      }
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
