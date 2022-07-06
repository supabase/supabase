import { StorageSizeUnits } from './StorageSettings.constants'

const k = 1024

export const convertFromBytes = (bytes: number) => {
  // Up to GB since that's our storage upload limit
  if (bytes <= 0) return { value: 0, unit: StorageSizeUnits.BYTES }

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formattedIdx = i > 3 ? 3 : i
  const unit = Object.values(StorageSizeUnits)[formattedIdx]
  const value = bytes / Math.pow(k, formattedIdx)
  return { value, unit }
}

export const convertToBytes = (size: number, unit: StorageSizeUnits = StorageSizeUnits.BYTES) => {
  const i = Object.values(StorageSizeUnits).indexOf(unit)
  if (size < 0 || i < 0) return 0

  return size * Math.pow(k, i)
}
