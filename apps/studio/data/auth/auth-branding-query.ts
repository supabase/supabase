import { useQuery } from '@tanstack/react-query'

import { authKeys } from './keys'
import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type AuthBrandingVariables = {
  projectRef?: string
}

export type AuthBrandingResponse = {
  brand_name: string | null
  brand_logo_url: string | null
  brand_color: string | null
  brand_footer_text: string | null
}

export async function getAuthBranding(
  { projectRef }: AuthBrandingVariables,
  signal?: AbortSignal
): Promise<AuthBrandingResponse> {
  if (!projectRef) throw new Error('projectRef is required')

  const baseUrl = API_URL?.replace('/platform', '')
  const url = `${baseUrl}/v1/projects/${projectRef}/config/auth/branding`
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const res = await fetchHandler(url, { method: 'GET', headers, signal })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    handleError(body)
  }

  return res.json()
}

export type AuthBrandingData = Awaited<ReturnType<typeof getAuthBranding>>
export type AuthBrandingError = ResponseError

export const useAuthBrandingQuery = <TData = AuthBrandingData>(
  { projectRef }: AuthBrandingVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<AuthBrandingData, AuthBrandingError, TData> = {}
) =>
  useQuery<AuthBrandingData, AuthBrandingError, TData>({
    queryKey: authKeys.authBranding(projectRef),
    queryFn: ({ signal }) => getAuthBranding({ projectRef }, signal),
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined' && projectRef !== '_',
    ...options,
  })
