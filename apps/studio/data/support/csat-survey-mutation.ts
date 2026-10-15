import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type CsatSurveyVariables = {
  conversationId: string
  satisfied: boolean
  comment?: string
}

export type CsatSurveyData = {
  result: 'success'
}

export async function submitCsatSurvey({
  conversationId,
  satisfied,
  comment,
}: CsatSurveyVariables): Promise<CsatSurveyData> {
  const baseUrl = API_URL?.replace('/platform', '')
  const url = `${baseUrl}/platform/support/csat`
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })

  const res = await fetchHandler(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ conversation_id: conversationId, satisfied, comment }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    handleError({ ...body, code: res.status })
  }

  return res.json() as Promise<CsatSurveyData>
}

export const useCsatSurveyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<CsatSurveyData, ResponseError, CsatSurveyVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<CsatSurveyData, ResponseError, CsatSurveyVariables>({
    mutationFn: (vars) => submitCsatSurvey(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to submit survey: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
