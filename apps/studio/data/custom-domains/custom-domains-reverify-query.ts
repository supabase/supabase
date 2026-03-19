import { useQuery, useQueryClient } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import { useEffect } from 'react'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { customDomainKeys } from './keys'

export type CustomDomainReverifyVariables = {
  projectRef?: string
}

export async function reverifyCustomDomain({ projectRef }: CustomDomainReverifyVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(`/v1/projects/{ref}/custom-hostname/reverify`, {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data
}

export type CustomDomainReverifyData = Awaited<ReturnType<typeof reverifyCustomDomain>>
export type CustomDomainReverifyError = ResponseError

export const useCustomDomainReverifyQuery = (
  { projectRef }: CustomDomainReverifyVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<CustomDomainReverifyData, CustomDomainReverifyError> = {}
) => {
  const client = useQueryClient()

  const query = useQuery<CustomDomainReverifyData, CustomDomainReverifyError>({
    queryKey: customDomainKeys.reverify(projectRef),
    queryFn: () => reverifyCustomDomain({ projectRef }),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

  useEffect(() => {
    if (!query.isSuccess) return
    client.invalidateQueries({ queryKey: customDomainKeys.list(projectRef) })
  }, [query.isSuccess, projectRef, client])

  return query
}
