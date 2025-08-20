import { useIsLoggedIn, useParams } from 'common'
import { OrganizationsError, useOrganizationsQuery } from 'data/organizations/organizations-query'
import { UseQueryResult } from '@tanstack/react-query'
import { Organization } from 'types'

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
