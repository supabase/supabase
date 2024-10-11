import { useIsLoggedIn } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useMemo } from 'react'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useProjectByRef } from './useSelectedProject'
import { useParams } from 'next/navigation'

export function useSelectedOrganization({ enabled = true } = {}) {
  const isLoggedIn = useIsLoggedIn()
  const params = useParams() || {} // Ensure params is always defined
  const { ref, slug } = params as { ref?: string; slug?: string }

  const { data } = useOrganizationsQuery({ enabled: isLoggedIn && enabled })

  // Hooks must be called unconditionally
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
