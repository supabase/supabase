import { useQuery } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import { UseCustomQueryOptions } from 'types'
import { projectKeys } from './keys'

export type ProjectTransferPreviewVariables = {
  projectRef?: string
  targetOrganizationSlug?: string
}

export async function previewProjectTransfer(
  { projectRef, targetOrganizationSlug }: ProjectTransferPreviewVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!targetOrganizationSlug) throw new Error('targetOrganizationSlug is required')

  const { data, error } = await post('/platform/projects/{ref}/transfer/preview', {
    params: { path: { ref: projectRef } },
    body: { target_organization_slug: targetOrganizationSlug },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectTransferPreviewData = Awaited<ReturnType<typeof previewProjectTransfer>>
export type ProjectTransferPreviewError = {
  message: string
}

export const useProjectTransferPreviewQuery = <TData = ProjectTransferPreviewData>(
  { projectRef, targetOrganizationSlug }: ProjectTransferPreviewVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectTransferPreviewData, ProjectTransferPreviewError, TData> = {}
) =>
  useQuery<ProjectTransferPreviewData, ProjectTransferPreviewError, TData>({
    queryKey: projectKeys.projectTransferPreview(projectRef, targetOrganizationSlug),
    queryFn: ({ signal }) => previewProjectTransfer({ projectRef, targetOrganizationSlug }, signal),
    enabled:
      enabled && typeof projectRef !== 'undefined' && typeof targetOrganizationSlug !== 'undefined',
    ...options,
  })
