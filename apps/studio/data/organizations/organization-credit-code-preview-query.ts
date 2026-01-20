import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMutation, useQuery } from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import { post, handleError } from 'data/fetchers'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { ResponseError, UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { organizationKeys } from './keys'

export type OrganizationCreditCodePreviewVariables = {
  slug?: string
  code: string
}

export async function previewCreditCode(
  { slug, code }: OrganizationCreditCodePreviewVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await post(
    `/platform/organizations/{slug}/billing/credits/preview-code`,
    {
      params: {
        path: {
          slug,
        },
      },
      body: { code },
      signal,
    }
  )
  if (error) handleError(error)

  return data
}

export type OrganizationPreviewCreditCodeData = Awaited<ReturnType<typeof previewCreditCode>>
export type OrganizationPreviewCreditCodeError = ResponseError

export const useOrganizationPreviewCreditCodeQuery = <TData = OrganizationPreviewCreditCodeData>(
  { slug, code }: OrganizationCreditCodePreviewVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    OrganizationPreviewCreditCodeData,
    OrganizationPreviewCreditCodeError,
    TData
  > = {}
) => {
  const { can: canApplyCreditCode } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  return useQuery<OrganizationPreviewCreditCodeData, OrganizationPreviewCreditCodeError, TData>({
    queryKey: organizationKeys.previewCreditCode(slug, code),
    queryFn: ({ signal }) => previewCreditCode({ slug, code }, signal),
    enabled: IS_PLATFORM && enabled && canApplyCreditCode && typeof slug !== 'undefined',
    ...options,
  })
}

export type OrganizationCreditCodeRedemptionVariables = {
  code: string
  slug?: string
  hcaptchaToken?: string | null
}

export async function previewCode({
  hcaptchaToken,
  code,
  slug,
}: OrganizationCreditCodeRedemptionVariables) {
  if (!hcaptchaToken) {
    throw new Error('Captcha not submitted')
  }

  if (!slug) {
    throw new Error('Slug is required')
  }

  const { data, error } = await post(
    `/platform/organizations/{slug}/billing/credits/preview-code`,
    {
      params: {
        path: {
          slug,
        },
      },
      body: {
        hcaptcha_token: hcaptchaToken,
        code,
      },
    }
  )

  if (error) handleError(error)

  return data
}

type OrganizationCreditCodePreviewData = Awaited<ReturnType<typeof previewCode>>

export const useOrganizationCreditCodeRedemptionMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OrganizationCreditCodePreviewData,
    ResponseError,
    OrganizationCreditCodeRedemptionVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    OrganizationCreditCodePreviewData,
    ResponseError,
    OrganizationCreditCodeRedemptionVariables
  >({
    mutationFn: (vars) => previewCode(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError !== undefined) {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
