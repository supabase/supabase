import { DataPoint } from 'data/analytics/constants'
import { ProjectUsageResponse } from 'data/usage/project-usage-query'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'
import { CategoryAttribute, USAGE_STATUS } from './Usage.constants'

// [Joshen] This is just for development to generate some test data for chart rendering
export const generateUsageData = (attribute: string, days: number): DataPoint[] => {
  const tempArray = new Array(days).fill(0)
  return tempArray.map((x, idx) => {
    return {
      loopId: (idx + 1).toString(),
      period_start: `${idx + 1}`,
      [attribute]: Math.floor(Math.random() * 100).toString(),
    }
  })
}

export const getUsageStatus = (attributes: CategoryAttribute[], usage?: ProjectUsageResponse) => {
  if (!usage) return USAGE_STATUS.NORMAL

  const attributeStatuses = attributes.map((attribute) => {
    const usageMeta = usage?.[attribute.key as keyof ProjectUsageResponse]
    const usageRatio =
      typeof usageMeta !== 'number' ? (usageMeta?.usage ?? 0) / (usageMeta?.limit ?? 0) : 0
    if (usageRatio >= 1) return USAGE_STATUS.EXCEEDED
    else if (usageRatio >= USAGE_APPROACHING_THRESHOLD) return USAGE_STATUS.APPROACHING
    else return USAGE_STATUS.NORMAL
  })

  if (attributeStatuses.find((x) => x === USAGE_STATUS.EXCEEDED)) return USAGE_STATUS.EXCEEDED
  else if (attributeStatuses.find((x) => x === USAGE_STATUS.APPROACHING))
    return USAGE_STATUS.APPROACHING
  else return USAGE_STATUS.NORMAL
}
