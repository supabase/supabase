import { AWS_REGIONS } from 'shared-data'
import { SMART_REGION_TO_EXACT_REGION_MAP } from 'shared-data/regions'

export function RegionsList() {
  return (
    <ul>
      {Object.keys(AWS_REGIONS).map((region) => (
        <li key={region} className="flex flex-col gap-2">
          <span className="w-fit !mt-0">{AWS_REGIONS[region].displayName}</span>
          <code className="w-fit">{AWS_REGIONS[region].code}</code>
        </li>
      ))}
    </ul>
  )
}
export function SmartRegionsList() {
  return (
    <ul>
      {[...SMART_REGION_TO_EXACT_REGION_MAP.entries()].map(([smartRegion, exactRegion]) => (
        <li key={smartRegion} className="flex flex-col gap-2">
          <span className="w-fit !mt-0">{smartRegion}</span>
          <code className="w-fit">{exactRegion}</code>
        </li>
      ))}
    </ul>
  )
}
