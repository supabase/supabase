import { BlockFieldConfig } from '../types'

/**
 * Common field configuration helpers to reduce duplication
 */

// Helper for simple fields that fallback from enrichedData to data
export const createField = (
  id: string,
  label: string,
  enrichedKey?: string,
  dataKey?: string,
  requiresEnrichedData = false
): BlockFieldConfig => ({
  id,
  label,
  getValue: (data, enrichedData) => {
    const eKey = enrichedKey || id
    const dKey = dataKey || id
    return enrichedData?.[eKey] || data?.[dKey]
  },
  requiresEnrichedData,
})

// Helper for truncated text fields
export const createTruncatedField = (
  id: string,
  label: string,
  maxLength: number,
  enrichedKey?: string,
  dataKey?: string,
  requiresEnrichedData = false
): BlockFieldConfig => ({
  id,
  label,
  getValue: (data, enrichedData) => {
    const eKey = enrichedKey || id
    const dKey = dataKey || id
    const value = enrichedData?.[eKey] || data?.[dKey]
    if (!value || typeof value !== 'string') return value
    return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value
  },
  requiresEnrichedData,
})

// Helper for ID fields that show truncated version
export const createIdField = (
  id: string,
  label: string,
  truncateLength = 8,
  enrichedKey?: string,
  dataKey?: string,
  requiresEnrichedData = false
): BlockFieldConfig => ({
  id,
  label,
  getValue: (data, enrichedData) => {
    const eKey = enrichedKey || id
    const dKey = dataKey || id
    const value = enrichedData?.[eKey] || data?.[dKey]
    if (!value) return null
    const stringValue = String(value)
    return truncateLength ? `${stringValue.substring(0, truncateLength)}...` : stringValue
  },
  requiresEnrichedData,
})

// Helper for time/duration fields
export const createTimeField = (
  id: string,
  label: string,
  unit = 'ms',
  enrichedKey?: string,
  dataKey?: string,
  requiresEnrichedData = false
): BlockFieldConfig => ({
  id,
  label,
  getValue: (data, enrichedData) => {
    const eKey = enrichedKey || id
    const dKey = dataKey || id
    const time = enrichedData?.[eKey] || data?.[dKey]
    return time ? `${time}${unit}` : null
  },
  requiresEnrichedData,
})

// Helper for status fields with fallback logic
export const createStatusField = (
  id: string = 'status',
  label: string = 'Status'
): BlockFieldConfig => ({
  id,
  label,
  getValue: (data, enrichedData) => enrichedData?.status || data?.status,
})

// Helper for path/filename extraction
export const createFileNameField = (
  id: string,
  label: string,
  pathKey = 'path',
  requiresEnrichedData = false
): BlockFieldConfig => ({
  id,
  label,
  getValue: (data, enrichedData) => {
    const path = enrichedData?.[pathKey] || data?.[pathKey]
    if (!path) return null
    // Remove query parameters and hash, get last segment
    const cleanPath = path.split('?')[0].split('#')[0]
    const segments = cleanPath.split('/')
    return segments[segments.length - 1] || null
  },
  requiresEnrichedData,
})

// Helper for conditional fields based on error status
export const createConditionalField = (
  id: string,
  label: string,
  getValue: (data: any, enrichedData?: any) => any,
  errorValue: string = 'Unavailable',
  deletedValue: string = 'Object deleted',
  requiresEnrichedData = false
): BlockFieldConfig => ({
  id,
  label,
  getValue: (data, enrichedData) => {
    const status = enrichedData?.status || data?.status
    const numStatus = Number(status)

    if (status === 404 || status === '404') {
      return deletedValue
    } else if (numStatus >= 400) {
      return errorValue
    }

    return getValue(data, enrichedData)
  },
  requiresEnrichedData,
})
