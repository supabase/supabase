import { useIsLoggedIn, useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useMemo } from 'react'

import { useProjectByRef } from './useSelectedProject'

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
