import { useQuery } from '@tanstack/react-query'

import { authKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type AuthTemplateReactVariables = {
  projectRef?: string
  template?: string
}

export type AuthTemplateReactResponse = {
  template_type: string
  source: string
  source_format: 'react'
  rendered_html: string | null
  is_default: boolean
}

export async function getAuthTemplateReact(
  { projectRef, template }: AuthTemplateReactVariables,
  signal?: AbortSignal
): Promise<AuthTemplateReactResponse> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!template) throw new Error('template is required')

  const response = await fetch(
    `${API_URL}/platform/auth/${projectRef}/templates/${template}/react`,
    { signal }
  )
  const body = await response.json()

  if (!response.ok) {
    handleError(body)
  }

  return body
}

export type AuthTemplateReactData = Awaited<ReturnType<typeof getAuthTemplateReact>>
export type AuthTemplateReactError = ResponseError

export const useAuthTemplateReactQuery = <TData = AuthTemplateReactData>(
  { projectRef, template }: AuthTemplateReactVariables,
  options: UseCustomQueryOptions<AuthTemplateReactData, AuthTemplateReactError, TData> = {}
) => {
  const { enabled = true, ...rest } = options

  return useQuery<AuthTemplateReactData, AuthTemplateReactError, TData>({
    queryKey: authKeys.reactTemplate(projectRef, template),
    queryFn: ({ signal }) => getAuthTemplateReact({ projectRef, template }, signal),
    enabled:
      enabled &&
      !IS_PLATFORM &&
      typeof projectRef !== 'undefined' &&
      typeof template !== 'undefined',
    ...rest,
  })
}
