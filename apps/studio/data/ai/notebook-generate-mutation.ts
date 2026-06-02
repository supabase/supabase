import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler } from '@/data/fetchers'
import type { NotebookGenerateOutput } from '@/lib/ai/notebook-generate-schema'
import { BASE_PATH } from '@/lib/constants'
import { ResponseError, UseCustomMutationOptions } from '@/types'

export type NotebookGenerateVariables = {
  prompt: string
  name?: string
  projectRef?: string
  connectionString?: string
  orgSlug?: string
}

export async function generateNotebook({
  prompt,
  name,
  projectRef,
  connectionString,
  orgSlug,
}: NotebookGenerateVariables): Promise<NotebookGenerateOutput> {
  const url = `${BASE_PATH}/api/ai/notebook/generate`

  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({
      prompt,
      name,
      projectRef,
      connectionString,
      orgSlug,
    }),
  })

  let body: { error?: string; message?: string } & Partial<NotebookGenerateOutput> = {}

  try {
    body = await response.json()
  } catch {}

  if (!response.ok) {
    throw new ResponseError(
      body?.error ?? body?.message ?? 'Failed to generate notebook',
      response.status
    )
  }

  return body as NotebookGenerateOutput
}

type NotebookGenerateData = Awaited<ReturnType<typeof generateNotebook>>

export const useNotebookGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<NotebookGenerateData, ResponseError, NotebookGenerateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<NotebookGenerateData, ResponseError, NotebookGenerateVariables>({
    mutationFn: (vars) => generateNotebook(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to generate notebook: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
