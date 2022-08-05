import { compact } from 'lodash'
import { USAGE_APPROACHING_THRESHOLD } from 'lib/constants'

export const getResourcesApproachingLimits = (usage: any) => {
  return compact(
    Object.keys(usage).map((resourceName) => {
      const resource = usage[resourceName]
      if (resource.value / resource.limit >= USAGE_APPROACHING_THRESHOLD) return resourceName
    })
  )
}

export const getResourcesExceededLimits = (usage: any) => {
  return compact(
    Object.keys(usage).map((resourceName) => {
      const resource = usage[resourceName]
      if (resource.value / resource.limit >= 1) return resourceName
    })
  )
}
