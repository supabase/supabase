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

const RATE_LIMIT_FALLBACK_SECONDS = 60

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
  const { data, error, response } = await post('/platform/feedback/send', {
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
    const httpResponse: unknown = response
    if (httpResponse instanceof Response && httpResponse.status === 429) {
      const resetHeader =
        httpResponse.headers.get('Retry-After') ?? httpResponse.headers.get('X-RateLimit-Reset')
      const parsedReset = resetHeader ? parseInt(resetHeader, 10) : NaN
      const waitSeconds = Number.isFinite(parsedReset) ? parsedReset : RATE_LIMIT_FALLBACK_SECONDS
      throw new ResponseError(
        `You have submitted too many support requests. Please try again in ${waitSeconds} second${waitSeconds === 1 ? '' : 's'}.`,
        429,
        undefined,
        waitSeconds
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
