export const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return 'N/A'
  try {
    const date = new Date(timestamp)
    return date.toLocaleString()
  } catch {
    return 'Invalid date'
  }
}

export const formatAuthUser = (authUser: string | null | undefined): string => {
  if (!authUser) return 'Anonymous'
  return authUser
}

export const getStatusVariant = (
  status: string | number | undefined
): 'default' | 'destructive' => {
  if (!status) return 'default'
  const statusCode = typeof status === 'string' ? parseInt(status) : status
  return statusCode >= 200 && statusCode < 400 ? 'default' : 'destructive'
}
