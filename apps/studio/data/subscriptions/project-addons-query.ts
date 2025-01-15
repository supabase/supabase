import { createQuery } from 'react-query-kit'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ProjectAddonsVariables = {
  projectRef: string
}

export async function getProjectAddons(
  { projectRef }: ProjectAddonsVariables,
  { signal }: { signal: AbortSignal }
) {
  const { error, data } = await get(`/platform/projects/{ref}/billing/addons`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectAddonsData = Awaited<ReturnType<typeof getProjectAddons>>
export type ProjectAddonsError = ResponseError

export const useProjectAddonsQuery = createQuery<
  ProjectAddonsData,
  ProjectAddonsVariables,
  ProjectAddonsError
>({
  queryKey: ['projects', 'addons'],
  fetcher: getProjectAddons,
})
