export function getLogDataForMetadataVisibility(data: unknown, metadataVisible: boolean) {
  if (metadataVisible || typeof data !== 'object' || data === null) return data

  const redactedData = { ...data, metadata: undefined }
  const rawLogData = 'raw_log_data' in data ? data.raw_log_data : undefined

  if (typeof rawLogData !== 'object' || rawLogData === null) return redactedData

  return {
    ...redactedData,
    raw_log_data: { ...rawLogData, metadata: undefined },
  }
}
