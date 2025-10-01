import { useIsLoggedIn, useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { PROVIDERS } from 'lib/constants'

export function useSelectedProjectQuery({ enabled = true } = {}) {
  const { ref } = useParams()

  return useProjectDetailQuery(
    { ref },
    {
      enabled,
      select: (data) => {
        return { ...data, parentRef: data.parent_project_ref ?? data.ref }
      },
    }
  )
}

export function useProjectByRefQuery(ref?: string) {
  const isLoggedIn = useIsLoggedIn()

  const projectQuery = useProjectDetailQuery({ ref }, { enabled: isLoggedIn })

  // [Alaister]: This is here for the purpose of improving performance.
  // Chances are, the user will already have the list of projects in the cache.
  // We can't exclusively rely on this method, as useProjectsQuery does not return branch projects.
  const projectsQuery = useProjectsQuery({
    enabled: isLoggedIn,
    select: (data) => {
      return data.projects.find((project) => project.ref === ref)
    },
  })

  if (projectQuery.isSuccess) {
    return projectQuery
  }

  return projectsQuery
}

export const useIsAwsCloudProvider = () => {
  const { data: project } = useSelectedProjectQuery()
  const isAws = project?.cloud_provider === PROVIDERS.AWS.id

  return isAws
}

export const useIsAwsK8sCloudProvider = () => {
  const { data: project } = useSelectedProjectQuery()
  const isAwsK8s = project?.cloud_provider === PROVIDERS.AWS_K8S.id

  return isAwsK8s
}

export const useIsAwsNimbusCloudProvider = () => {
  const { data: project } = useSelectedProjectQuery()
  const isAwsNimbus = project?.cloud_provider === PROVIDERS.AWS_NIMBUS.id

  return isAwsNimbus
}

export const useIsOrioleDb = () => {
  const { data: project } = useSelectedProjectQuery()
  const isOrioleDb = project?.dbVersion?.endsWith('orioledb')
  return isOrioleDb
}

export const useIsOrioleDbInAws = () => {
  const { data: project } = useSelectedProjectQuery()
  const isOrioleDbInAws =
    project?.dbVersion?.endsWith('orioledb') && project?.cloud_provider === PROVIDERS.AWS.id
  return isOrioleDbInAws
}
