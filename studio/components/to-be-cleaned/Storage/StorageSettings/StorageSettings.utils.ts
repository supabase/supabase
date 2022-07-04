import { StorageSizeUnits } from './StorageSettings.constants'

const k = 1024

// [JOSHEN TODO] Write tests for this
export const convertFromBytes = (bytes: number) => {
  // Up to GB since that's our storage upload limit
  if (bytes === 0) return { value: 0, unit: StorageSizeUnits.BYTES }

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unit = Object.values(StorageSizeUnits)[i]
  const value = bytes / Math.pow(k, i)
  return { value, unit }
}

export const convertToBytes = (size: number, unit: StorageSizeUnits) => {
  const i = Object.values(StorageSizeUnits).indexOf(unit)
  return size * Math.pow(k, i)
}
