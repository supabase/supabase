import { useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { PROVIDERS } from 'lib/constants'

export function useSelectedProjectQuery({ enabled = true } = {}) {
  const { ref } = useParams()

  return useProjectDetailQuery(
    { ref },
    {
      enabled,
      select: (data) => {
        return {
          ...data,
          parentRef: data.parent_project_ref ?? data.ref,
        }
      },
    }
  )
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
