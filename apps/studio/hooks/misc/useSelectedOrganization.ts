import { useIsLoggedIn, useParams } from 'common'
import { OrganizationsError, useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useMemo } from 'react'

import { useProjectByRef } from './useSelectedProject'
import { Organization } from '../../types/index.js'
import { UseQueryResult } from '@tanstack/react-query'

/**
 * @deprecated Use useSelectedOrganizationQuery instead for access to loading states etc
 *
 * Example migration:
 * ```
 * // Old:
 * const organization = useSelectedOrganization()
 *
 * // New:
 * const { data: organization } = useSelectedOrganizationQuery()
 * ```
 */
export function useSelectedOrganization({ enabled = true } = {}) {
  const isLoggedIn = useIsLoggedIn()

  const { slug } = useParams()
  const { data = [] } = useOrganizationsQuery({ enabled: isLoggedIn && enabled })

  return useMemo(() => {
    return data?.find((org) => {
      if (slug !== undefined) return org.slug === slug
      return undefined
    })
  }, [data, slug])
}

export function useSelectedOrganizationQuery({
  enabled = true
} = {}): UseQueryResult<Organization | undefined, OrganizationsError> {
  const isLoggedIn = useIsLoggedIn()

  const { slug } = useParams()
  return useOrganizationsQuery({
    enabled: isLoggedIn && enabled,
    select: (data) => {
      return data.find((org) => {
        if (slug !== undefined) return org.slug === slug
        return undefined
      })
    },
  })
}
