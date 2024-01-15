import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { projectKeys } from './keys'

export type ProjectTransferPreviewVariables = {
  projectRef?: string
  targetOrganizationSlug?: string
}

export type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

type MemberExceedingFreeProjectLimit = {
  name: string
  limit: number
}

type PreviewTransferInfo = {
  key: string
  message: string
}

export type PreviewProjectTransferResponse = {
  valid: boolean

  warnings: PreviewTransferInfo[]
  errors: PreviewTransferInfo[]

  members_exceeding_free_project_limit: MemberExceedingFreeProjectLimit[]

  has_permissions_on_source_organization: boolean
  has_access_to_target_organization: boolean

  source_project_eligible: boolean

  target_organization_eligible: boolean | null
  target_organization_has_free_project_slots: boolean | null

  credits_on_source_organization: number
  costs_on_target_organization: number
  charge_on_target_organization: number

  source_subscription_plan: PlanId
  target_subscription_plan: PlanId | null
}

export async function previewProjectTransfer(
  { projectRef, targetOrganizationSlug }: ProjectTransferPreviewVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!targetOrganizationSlug) throw new Error('targetOrganizationSlug is required')

  const response = await post(
    `${API_URL}/projects/${projectRef}/transfer/preview`,
    {
      target_organization_slug: targetOrganizationSlug,
    },
    { signal }
  )
  if (response.error) throw response.error

  return response as PreviewProjectTransferResponse
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
