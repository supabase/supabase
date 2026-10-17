import { useParams } from 'common'

import {
  isOrioleDbVersionAtLeast,
  ORIOLEDB_PUBLIC_BETA_VERSION,
  type OrioleDbReleaseStage,
} from './useSelectedProject.utils'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { PROJECT_STATUS, PROVIDERS } from '@/lib/constants'

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

// OrioleDB moved from Public Alpha to Public Beta at engine version 17.11.0.001.
// PITR remains unsupported for every OrioleDB version regardless of stage.
export const useOrioleDbReleaseStage = (): OrioleDbReleaseStage | undefined => {
  const { data: project } = useSelectedProjectQuery()
  if (!project?.dbVersion?.endsWith('orioledb')) return undefined
  return isOrioleDbVersionAtLeast(project.dbVersion, ORIOLEDB_PUBLIC_BETA_VERSION)
    ? 'beta'
    : 'alpha'
}

// [Joshen TODO] There's a duplicate method `resolveHighAvailability` in `useHighAvailability.constants`
export const useIsHighAvailability = () => {
  const { data: project } = useSelectedProjectQuery()
  return project?.high_availability ?? false
}

export const useIsProjectActive = () => {
  const { data: project } = useSelectedProjectQuery()
  return project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
}
