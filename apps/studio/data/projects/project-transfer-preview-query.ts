import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import { projectKeys } from './keys'

export type ProjectTransferPreviewVariables = {
  projectRef?: string
  targetOrganizationSlug?: string
}

export type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

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
  }: UseQueryOptions<ProjectTransferPreviewData, ProjectTransferPreviewError, TData> = {}
) =>
  useQuery<ProjectTransferPreviewData, ProjectTransferPreviewError, TData>(
    projectKeys.projectTransferPreview(projectRef, targetOrganizationSlug),
    ({ signal }) => previewProjectTransfer({ projectRef, targetOrganizationSlug }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof targetOrganizationSlug !== 'undefined',
      ...options,

      retry: (failureCount, error) => {
        // Don't retry on 400s
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as any).code === 400
        ) {
          return false
        }

        if (failureCount < 3) {
          return true
        }

        return false
      },
    }
  )
