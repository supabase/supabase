import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ExtendedSupportCategories } from 'components/interfaces/Support/Support.constants'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type LinkSupportTicketVariables = {
  conversation_id: string
  org_id: number
  project_ref?: string
  category: ExtendedSupportCategories
  allow_support_access: boolean
}

export async function linkSupportTicket({
  conversation_id,
  org_id,
  project_ref,
  category,
  allow_support_access,
}: LinkSupportTicketVariables) {
  const { data, error } = await patch(
    '/platform/feedback/conversations/{conversation_id}/custom-fields',
    {
      params: { path: { conversation_id } },
      body: {
        org_id,
        project_ref,
        category,
        allow_support_access,
      },
    }
  )

  if (error) {
    handleError(error, {
      alwaysCapture: true,
      sentryContext: {
        tags: {
          linkSupportTicket: true,
        },
      },
    })
  }
  return data
}

type LinkSupportTicketData = Awaited<ReturnType<typeof linkSupportTicket>>

export const useLinkSupportTicketMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LinkSupportTicketData, ResponseError, LinkSupportTicketVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<LinkSupportTicketData, ResponseError, LinkSupportTicketVariables>({
    mutationFn: (vars) => linkSupportTicket(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to link support ticket: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
