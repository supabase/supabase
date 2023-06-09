import { compact } from 'lodash'
import { USAGE_APPROACHING_THRESHOLD } from 'lib/constants'

export const getResourcesApproachingLimits = (usages: any) => {
  if (!usages) return []

  return compact(
    Object.keys(usages)
      .filter((resourceName) => usages[resourceName] !== null)
      .map((resourceName) => {
        const resource = usages[resourceName]
        if (resource.usage / resource.limit >= USAGE_APPROACHING_THRESHOLD) return resourceName
      })
  )
}

export const getResourcesExceededLimits = (usages: any) => {
  if (!usages) return []

  return compact(
    Object.keys(usages)
      .filter((resourceName) => usages[resourceName] !== null)
      .map((resourceName) => {
        const resource = usages[resourceName]
        if (resource.limit > 0 && (resource.usage / resource.limit) > 1) return resourceName
      })
  )
}
