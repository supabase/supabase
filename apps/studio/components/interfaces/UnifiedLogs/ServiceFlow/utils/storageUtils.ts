/**
 * Storage-specific utility functions for service flow
 */

/**
 * getStorageMetadata - Get storage metadata from enriched data or fallback
 *
 * This is the only storage utility we keep since it's specific to our service flow data structure.
 * All other storage utilities (file extensions, type detection, etc.) should use the
 * existing storage explorer utilities or standard helpers.
 */
export const getStorageMetadata = (data: any, enrichedData?: any): any => {
  // First try to get from enrichedData (service flow)
  const storageMetadata = enrichedData?.storage_metadata
  if (storageMetadata) {
    return storageMetadata
  }

  // Fallback to data metadata
  const dataMetadata = data?.metadata
  if (dataMetadata) {
    return dataMetadata
  }

  return {}
}
