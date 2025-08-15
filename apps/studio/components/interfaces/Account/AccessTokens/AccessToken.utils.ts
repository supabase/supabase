// Calculate expiration date for display
export const getExpirationDateText = (expiryOption: string) => {
  if (expiryOption === 'No expiry') return 'Token never expires'

  const now = new Date()
  let expirationDate: Date

  switch (expiryOption) {
    case '7 days':
      expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case '30 days':
      expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      break
    case '90 days':
      expirationDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      break
    case '180 days':
      expirationDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
      break
    default:
      return 'Token never expires'
  }

  return `Token expires ${expirationDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })}`
}

// Create a flat list of all available resources for the searchable dropdown
export const createAllResources = (ACCESS_TOKEN_PERMISSIONS: any[]) => {
  return ACCESS_TOKEN_PERMISSIONS.flatMap((group) =>
    group.resources.map((resource: any) => ({
      resource: resource.resource,
      title: resource.title,
      actions: resource.actions,
      group: group.name,
    }))
  )
}
