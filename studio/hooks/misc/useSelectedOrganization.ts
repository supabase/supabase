import { useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useMemo } from 'react'

import { useSelectedProject } from './useSelectedProject'

export function useSelectedOrganization({ enabled = true } = {}) {
  const { slug } = useParams()
  const { data } = useOrganizationsQuery({ enabled })
  const selectedProject = useSelectedProject()

  return useMemo(() => {
    return data?.find(
      (org) => org.slug === slug || (selectedProject && org.id === selectedProject.organization_id)
    )
  }, [data, selectedProject, slug])
}
