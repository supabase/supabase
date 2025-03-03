import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { ResponseError } from 'types'
import { lintKeys } from './keys'

export type ServiceRoleKeyLeakVariables = {
  projectRef?: string
}

export type ServiceRoleKeyLeakResponse = boolean

export async function checkServiceRoleKeyLeak(
  { projectRef }: ServiceRoleKeyLeakVariables,
  signal?: AbortSignal
): Promise<ServiceRoleKeyLeakResponse> {
  if (!projectRef) throw new Error('Project ref is required')

  const res = await fetch(`${BASE_PATH}/api/check-service-role-key-leak`, {
    headers: {
      'x-project': projectRef,
    },
    signal,
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message || 'Failed to fetch service role key leak data')
  }

  return res.json()
}

export type ServiceRoleKeyLeakData = Awaited<ReturnType<typeof checkServiceRoleKeyLeak>>
export type ServiceRoleKeyLeakError = ResponseError

export const useServiceRoleKeyLeakQuery = <TData = ServiceRoleKeyLeakData>(
  { projectRef }: ServiceRoleKeyLeakVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ServiceRoleKeyLeakData, ServiceRoleKeyLeakError, TData> = {}
) => {
  const project = useSelectedProject()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ServiceRoleKeyLeakData, ServiceRoleKeyLeakError, TData>(
    lintKeys.serviceRoleKeyLeak(projectRef),
    ({ signal }) => checkServiceRoleKeyLeak({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
      ...options,
    }
  )
}
