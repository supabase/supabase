import { useIsLoggedIn, useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useMemo } from 'react'

import { useProjectByRef, useProjectByRefQuery } from './useSelectedProject'

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

  const { ref, slug } = useParams()
  const { data } = useOrganizationsQuery({ enabled: isLoggedIn && enabled })

  const selectedProject = useProjectByRef(ref)

  return useMemo(() => {
    return data?.find((org) => {
      if (slug !== undefined) return org.slug === slug
      if (selectedProject !== undefined) return org.id === selectedProject.organization_id
      return undefined
    })
  }, [data, selectedProject, slug])
}

export function useSelectedOrganizationQuery({ enabled = true } = {}) {
  const isLoggedIn = useIsLoggedIn()

  const { ref, slug } = useParams()
  const { data: selectedProject } = useProjectByRefQuery(ref)

  return useOrganizationsQuery({
    enabled: isLoggedIn && enabled,
    select: (data) => {
      return data.find((org) => {
        if (slug !== undefined) return org.slug === slug
        if (selectedProject !== undefined) return org.id === selectedProject.organization_id
        return undefined
      })
    },
  })
}
