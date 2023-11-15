import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { ResponseError } from 'types'

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
  const res = await fetch(`https://1.1.1.1/dns-query?name=${domain}&type=CNAME`, {
    method: 'GET',
    headers: { accept: 'application/dns-json' },
  })
  const verification = (await res.json()) as CheckCNAMERecordResponse

  if (verification.Answer === undefined) {
    throw new Error(
      `Your CNAME record for ${domain} cannot be found - if you've just added the record, do check back in a bit.`
    )
  }

  return verification.Answer.some((x) => x.type === 5)
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
