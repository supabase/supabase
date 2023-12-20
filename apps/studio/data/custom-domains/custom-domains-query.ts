import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import { customDomainKeys } from './keys'

export type CustomDomainsVariables = {
  projectRef?: string
}

type Settings = {
  http2: string
  tls_1_3: string
  min_tls_version: string
}

type Ssl = {
  id: string
  type: string
  method: string
  status: 'pending_validation' | 'pending_deployment' | 'validation_timed_out'
  txt_name?: string
  txt_value?: string
  settings: Settings
  wildcard: boolean
  bundle_method: string
  certificate_authority: string
  validation_records?: {
    status: string
    txt_name: string
    txt_value: string
  }[]
  validation_errors?: {
    message: string
  }[]
}

type OwnershipVerification = {
  name: string
  type: string
  value: string
}

type OwnershipVerificationHttp = {
  http_url: string
  http_body: string
}

export type CustomDomainResponse = {
  id: string
  ssl: Ssl
  status: string
  hostname: string
  created_at: string
  custom_metadata: any
  verification_errors?: string[]
  custom_origin_server: string
  ownership_verification?: OwnershipVerification
  ownership_verification_http?: OwnershipVerificationHttp
}

export async function getCustomDomains(
  { projectRef }: CustomDomainsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const { data, error } = await get('/v1/projects/{ref}/custom-hostname', {
    params: {
      path: {
        ref: projectRef,
      },
    },
    signal,
  })

  if (error) {
    // not allowed error and no hostname configured error are
    // valid steps in the process of setting up a custom domain
    // so we convert them to data instead of errors

    const isNotAllowedError = (error as any)?.message?.includes(
      'not allowed to set up custom domain'
    )

    if (isNotAllowedError) {
      return {
        customDomain: null,
        status: '0_not_allowed',
      } as const
    }

    const isNoHostnameConfiguredError = (error as any)?.message?.includes(
      'custom hostname configuration'
    )

    if (isNoHostnameConfiguredError) {
      return {
        customDomain: null,
        status: '0_no_hostname_configured',
      } as const
    }

    throw error
  }

  return { customDomain: data.data.result as CustomDomainResponse, status: data.status }
}

export type CustomDomainsData = Awaited<ReturnType<typeof getCustomDomains>>
export type CustomDomainsError = unknown

export const useCustomDomainsQuery = <TData = CustomDomainsData>(
  { projectRef }: CustomDomainsVariables,
  { enabled = true, ...options }: UseQueryOptions<CustomDomainsData, CustomDomainsError, TData> = {}
) =>
  useQuery<CustomDomainsData, CustomDomainsError, TData>(
    customDomainKeys.list(projectRef),
    ({ signal }) => getCustomDomains({ projectRef }, signal),
    { enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined', ...options }
  )
