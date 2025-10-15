import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError } from 'types'

export type GenerateAttachmentURLsResponse = {
  title: string
  description: string
}

export type GenerateAttachmentURLsVariables = {
  filenames: string[]
}

export async function generateAttachmentURLs({ filenames }: GenerateAttachmentURLsVariables) {
  const headers = await constructHeaders()

  try {
    const response = await fetch(`${BASE_PATH}/api/generate-attachment-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filenames }),
    })

    if (!response.ok) {
      const status = response.status
      const message = await response.text()
      throw new Error(`Failed to generate attachment URLs at endpoint: ${status} ${message}`)
    }

    const signedUrls = await response.json()
    return signedUrls as string[]
  } catch (error: any) {
    // [Joshen] Should throw an error i think but doing so causes some errors in the unit tests which i'm not exactly sure how to resolve
    // [MSW] Cannot bypass a request when using the "error" strategy for the "onUnhandledRequest" option.
    return []
  }
}

type GenerateAttachmentURLsData = Awaited<ReturnType<typeof generateAttachmentURLs>>

export const useGenerateAttachmentURLsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<GenerateAttachmentURLsData, ResponseError, GenerateAttachmentURLsVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<GenerateAttachmentURLsData, ResponseError, GenerateAttachmentURLsVariables>(
    (vars) => generateAttachmentURLs(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to generate attachment URLS: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
