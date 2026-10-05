import { useFlag } from 'common'
import { useMemo } from 'react'

import {
  parseRestrictedRegions,
  resolveRegionRestriction,
  RESTRICTED_REGIONS_FLAG_KEY,
} from './RegionSelector.utils'

type RegionLike = {
  code: string
  status?: string
}

export function useRegionRestriction() {
  const restrictedRegionsFlag = useFlag<string | boolean>(RESTRICTED_REGIONS_FLAG_KEY)
  const restrictedRegions = useMemo(
    () => parseRestrictedRegions(restrictedRegionsFlag),
    [restrictedRegionsFlag]
  )

  const getRegionRestriction = (region: RegionLike | undefined) =>
    region === undefined
      ? undefined
      : resolveRegionRestriction({
          platformStatus: region.status,
          flagRestriction: restrictedRegions[region.code],
        })

  return { getRegionRestriction }
}
