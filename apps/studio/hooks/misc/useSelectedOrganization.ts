import { useIsLoggedIn, useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useMemo } from 'react'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useProjectByRef } from './useSelectedProject'

export function useSelectedOrganization({ enabled = true } = {}) {
  const isLoggedIn = useIsLoggedIn()

  const { ref, slug } = useParams()
  const { data } = useOrganizationsQuery({ enabled: isLoggedIn && enabled })

  const selectedProject = useProjectByRef(ref)

  const localStorageSlug = useMemo(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION)
      : null
  }, [])

  return useMemo(() => {
    return data?.find((org) => {
      if (slug !== undefined) return org.slug === slug
      if (selectedProject !== undefined) return org.id === selectedProject.organization_id
      if (localStorageSlug !== undefined) return org.slug === localStorageSlug
      return undefined
    })
  }, [data, selectedProject, slug, localStorageSlug])
}
