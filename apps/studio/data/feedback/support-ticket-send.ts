import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

// End of third-party imports

import type { ExtendedSupportCategories } from '@/components/interfaces/Support/Support.constants'
import { handleError, post } from '@/data/fetchers'
import { ResponseError } from '@/types'
import type { UseCustomMutationOptions } from '@/types'

export type sendSupportTicketVariables = {
  subject: string
  message: string
  category: ExtendedSupportCategories
  severity: string
  projectRef?: string
  organizationSlug?: string
  library?: string
  affectedServices?: string
  browserInformation?: string
  allowSupportAccess: boolean
  siteUrl?: string
  additionalRedirectUrls?: string
  dashboardSentryIssueId?: string
  dashboardLogs?: string
  dashboardStudioVersion?: string
}

export async function sendSupportTicket({
  subject,
  message,
  category,
  severity,
  projectRef,
  organizationSlug,
  library,
  affectedServices,
  browserInformation,
  allowSupportAccess,
  siteUrl,
  additionalRedirectUrls,
  dashboardSentryIssueId,
  dashboardLogs,
  dashboardStudioVersion,
}: sendSupportTicketVariables) {
  const { data, error } = await post('/platform/feedback/send', {
    body: {
      subject,
      message,
      category,
      severity,
      projectRef,
      organizationSlug,
      library,
      verified: true,
      tags: ['dashboard-support-form'],
      siteUrl,
      additionalRedirectUrls,
      affectedServices,
      browserInformation,
      allowSupportAccess,
      dashboardSentryIssueId,
      dashboardLogs,
      dashboardStudioVersion,
    },
  })

  if (error) {
    // openapi-fetch resolves this endpoint's result to `never`, so we widen to
    // `unknown` and validate the fields at runtime (the same checks handleError
    // uses) rather than asserting a shape.
    const apiError: unknown = error
    let code: number | undefined
    let retryAfterValue: number | undefined
    if (typeof apiError === 'object' && apiError !== null) {
      if ('code' in apiError && typeof apiError.code === 'number') {
        code = apiError.code
      }
      if ('retryAfter' in apiError && typeof apiError.retryAfter === 'number') {
        retryAfterValue = apiError.retryAfter
      }
    }

    // Rate-limited submissions (429) are an expected, recoverable condition, so we
    // surface a friendly message and do not report them to Sentry. The endpoint is
    // throttled to one request per 60 seconds and does not always send a retryAfter
    // value, so fall back to that known window.
    if (code === 429) {
      const retryAfter = retryAfterValue ?? 60
      throw new ResponseError(
        `You have submitted too many support requests. Please try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`,
        429,
        undefined,
        retryAfter
      )
    }

    // Any other error: capture to Sentry and rethrow with support-form context.
    handleError(error, {
      alwaysCapture: true,
      sentryContext: {
        tags: {
          dashboardSupportForm: true,
        },
      },
    })
  }
  return data
}

type sendSupportTicketData = Awaited<ReturnType<typeof sendSupportTicket>>

export const useSendSupportTicketMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<sendSupportTicketData, ResponseError, sendSupportTicketVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<sendSupportTicketData, ResponseError, sendSupportTicketVariables>({
    mutationFn: (vars) => sendSupportTicket(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to submit support ticket: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
