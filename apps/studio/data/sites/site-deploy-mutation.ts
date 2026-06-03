import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, handleError } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'
import { sitesKeys } from './keys'

export type SiteDeployVariables = {
  projectRef: string
  slug: string
  /** Files to upload. A single .zip is extracted server-side; otherwise each file is written. */
  files: File[]
  /** 'replace' clears the docroot first; 'merge' keeps existing files (default). */
  mode?: 'merge' | 'replace'
}

export type SiteDeployResponse = { slug: string; files: number; replaced: boolean }

export async function deploySite({ projectRef, slug, files, mode = 'merge' }: SiteDeployVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (files.length === 0) throw new Error('No files selected')

  const formData = new FormData()
  for (const file of files) {
    // Preserve sub-folder paths for folder uploads (webkitRelativePath), else the name.
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
    formData.append('file', file, relativePath && relativePath.length > 0 ? relativePath : file.name)
  }

  // Don't set Content-Type — the browser adds the multipart boundary.
  const headers = await constructHeaders()
  const response = await fetch(
    `${BASE_PATH}/api/v1/projects/${projectRef}/sites/${slug}/deploy?mode=${mode}`,
    { method: 'POST', body: formData, headers, credentials: 'include' }
  )

  if (!response.ok) {
    let body: any
    try {
      body = await response.json()
    } catch {
      // ignore
    }
    handleError(body?.error ?? body ?? { message: `Deploy failed (status ${response.status})` })
  }

  return (await response.json()) as SiteDeployResponse
}

export const useSiteDeployMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SiteDeployResponse, ResponseError, SiteDeployVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SiteDeployResponse, ResponseError, SiteDeployVariables>({
    mutationFn: (vars) => deploySite(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: sitesKeys.files(variables.projectRef, variables.slug),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) toast.error(`Failed to deploy: ${data.message}`)
      else onError(data, variables, context)
    },
    ...options,
  })
}
