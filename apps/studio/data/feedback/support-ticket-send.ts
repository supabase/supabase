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
    // openapi-fetch types this error as `never` (the endpoint declares no error
    // schema), but at runtime our fetcher populates `code` and `retryAfter` from
    // the response, so we read them through a narrow shape.
    const apiError = error as { code?: number; retryAfter?: number }
    if (apiError.code === 429) {
      // The support feedback endpoint is throttled to 1 request per 60 seconds
      // server-side. It does not return a standard Retry-After header, so fall
      // back to the known 60 second window when one isn't provided.
      const retryAfter = typeof apiError.retryAfter === 'number' ? apiError.retryAfter : 60
      throw new ResponseError(
        `You have submitted too many support requests. Please try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`,
        429,
        undefined,
        retryAfter
      )
    }
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
