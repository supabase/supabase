import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { head } from 'data/fetchers'
import { ResponseError } from 'types'
import { invoicesKeys } from './keys'

export type ProjectInvoicesCountVariables = {
  projectRef?: string
}

export async function getProjectInvoicesCount(
  { projectRef }: ProjectInvoicesCountVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const res = await head(`/platform/projects/{ref}/invoices`, {
    params: { path: { ref: projectRef } },
    signal,
    parseAs: 'text',
  })

  if (res.error) throw (res as any).error
  return Number(res.response.headers.get('X-Total-Count'))
}

export type ProjectInvoicesCountData = Awaited<ReturnType<typeof getProjectInvoicesCount>>
export type ProjectInvoicesCountError = ResponseError

export const useProjectInvoicesCountQuery = <TData = ProjectInvoicesCountData>(
  { projectRef }: ProjectInvoicesCountVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectInvoicesCountData, ProjectInvoicesCountError, TData> = {}
) =>
  useQuery<ProjectInvoicesCountData, ProjectInvoicesCountError, TData>(
    invoicesKeys.projectInvoicesCount(projectRef),
    ({ signal }) => getProjectInvoicesCount({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
