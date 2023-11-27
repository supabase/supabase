import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { isResponseOk, post } from 'lib/common/fetch'
import { BASE_PATH } from 'lib/constants'
import { ResponseError } from 'types'

export type RlsSuggestResponse = {
  threadId: string
  runId: string
}

export type RlsSuggestVariables = {
  thread_id?: string
  entityDefinitions?: string[]
  prompt: string
}

export async function rlsSuggest({ thread_id, entityDefinitions, prompt }: RlsSuggestVariables) {
  const response = await post<RlsSuggestResponse>(BASE_PATH + '/api/ai/sql/suggest', {
    thread_id,
    entityDefinitions,
    prompt,
  })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type RlsSuggestData = Awaited<ReturnType<typeof rlsSuggest>>

export const useRlsSuggestMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<RlsSuggestData, ResponseError, RlsSuggestVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<RlsSuggestData, ResponseError, RlsSuggestVariables>(
    (vars) => rlsSuggest(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to prompt suggestion: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
