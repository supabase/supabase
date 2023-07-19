import { useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useMemo } from 'react'

import { useSelectedProject } from './useSelectedProject'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

export function useSelectedOrganization({ enabled = true } = {}) {
  const { slug } = useParams()
  const { data } = useOrganizationsQuery({ enabled })
  const selectedProject = useSelectedProject()
  const localStorageSlug =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION)
      : undefined

  return useMemo(() => {
    return data?.find((org) => {
      if (slug !== undefined) return org.slug === slug
      if (selectedProject !== undefined) return org.id === selectedProject.organization_id
      if (localStorageSlug !== undefined) return org.slug === localStorageSlug
      return undefined
    })
  }, [data, selectedProject, slug, localStorageSlug])
}
