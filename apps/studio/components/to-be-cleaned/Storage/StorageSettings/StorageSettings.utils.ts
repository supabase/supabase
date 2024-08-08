import { ProjectApiResponse } from 'data/config/project-api-query'
import { StorageSizeUnits } from './StorageSettings.constants'

const k = 1024

export const convertFromBytes = (bytes: number, unit?: StorageSizeUnits) => {
  // Up to GB since that's our storage upload limit
  if (bytes <= 0) return { value: 0, unit: StorageSizeUnits.BYTES }

  const i =
    unit !== undefined
      ? Object.values(StorageSizeUnits).indexOf(unit)
      : Math.floor(Math.log(bytes) / Math.log(k))

  const formattedIdx = unit !== undefined ? (i < 0 ? 0 : i) : i > 3 ? 3 : i

  const formattedUnit = Object.values(StorageSizeUnits)[formattedIdx]
  const value = bytes / Math.pow(k, formattedIdx)
  return { value, unit: formattedUnit }
}

export const convertToBytes = (size: number, unit: StorageSizeUnits = StorageSizeUnits.BYTES) => {
  const i = Object.values(StorageSizeUnits).indexOf(unit)
  if (size < 0 || i < 0) return 0

  return size * Math.pow(k, i)
}

export function getConnectionURL(projectRef: string, projectAPI?: ProjectApiResponse) {
  if (projectAPI === undefined) return ''

  const projUrl = projectAPI
    ? `${projectAPI.autoApiService.protocol}://${projectAPI.autoApiService.endpoint}`
    : `https://${projectRef}.supabase.co`

  const url = new URL(projUrl)
  url.pathname = '/storage/v1/s3'
  return url.toString()
}
