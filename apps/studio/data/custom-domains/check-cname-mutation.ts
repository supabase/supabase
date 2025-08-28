import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { fetchHandler, handleError } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { toast } from 'sonner'

import type { ResponseError } from 'types'

export type CheckCNAMERecordVariables = {
  domain: string
}

export type CheckCNAMERecordResponse = {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: { name: string; type: number }[]
  Answer?: { name: string; type: number; TTL: number; data: string }[]
  Authority: { name: string; type: number; TTL: number; data: string }[]
}

// [Joshen] Should tally with https://github.com/supabase/cli/blob/63790a1bd43bee06f82c4f510e709925526a4daa/internal/utils/api.go#L98
export async function checkCNAMERecord({ domain }: CheckCNAMERecordVariables) {
  try {
    const res: CheckCNAMERecordResponse = await fetchHandler(
      `${BASE_PATH}/api/check-cname?domain=${domain}`
    ).then((res) => res.json())

    if (res.Answer === undefined) {
      throw new Error(
        `Your CNAME record for ${domain} cannot be found - if you've just added the record, do check back in a bit.`
      )
    }

    return res.Answer.some((x) => x.type === 5)
  } catch (error) {
    handleError(error)
  }
}

type CheckCNAMERecordData = Awaited<ReturnType<typeof checkCNAMERecord>>

export const useCheckCNAMERecordMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CheckCNAMERecordData, ResponseError, CheckCNAMERecordVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<CheckCNAMERecordData, ResponseError, CheckCNAMERecordVariables>(
    (vars) => checkCNAMERecord(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to check CNAME record: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
