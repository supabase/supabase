import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { isResponseOk, post } from 'lib/common/fetch'
import { BASE_PATH } from 'lib/constants'
import type { ResponseError } from 'types'

export type CronSyntaxGenerateVariables = {
  prompt: string
}

export async function generateCronSyntax({ prompt }: CronSyntaxGenerateVariables) {
  const response = await post<string>(BASE_PATH + '/api/ai/sql/cron', {
    prompt,
  })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type CronSyntaxGenerateData = Awaited<ReturnType<typeof generateCronSyntax>>

export const useCronSyntaxGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CronSyntaxGenerateData, ResponseError, CronSyntaxGenerateVariables>,
  'mutationFn'
> = {}) => {
  const mutation = useMutation<CronSyntaxGenerateData, ResponseError, CronSyntaxGenerateVariables>(
    (vars) => generateCronSyntax(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to generate cron syntax from this input: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )

  return mutation
}
