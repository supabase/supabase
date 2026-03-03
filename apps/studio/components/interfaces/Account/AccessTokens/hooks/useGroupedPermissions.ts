import { useMemo } from 'react'
import { ACCESS_TOKEN_RESOURCES } from '../AccessToken.constants'
import { getRealAccess, formatAccessText } from '../AccessToken.utils'

export const useGroupedPermissions = (tokenPermissions: string[] | undefined) => {
  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, string[]> = {}

    if (!tokenPermissions || tokenPermissions.length === 0) {
      return grouped
    }

    ACCESS_TOKEN_RESOURCES.forEach((resource) => {
      const access = getRealAccess(resource.resource, tokenPermissions)
      if (access !== 'no access') {
        const formattedAccess = formatAccessText(access)
        if (!grouped[formattedAccess]) {
          grouped[formattedAccess] = []
        }
        grouped[formattedAccess].push(resource.title)
      }
    })

    return grouped
  }, [tokenPermissions])

  const totalCount = Object.values(groupedPermissions).reduce(
    (sum, resources) => sum + resources.length,
    0
  )

  return { groupedPermissions, totalCount }
}
