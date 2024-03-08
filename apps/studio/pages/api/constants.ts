import { paths } from 'data/api'
import { FilterKeys, MediaType, Success } from 'openapi-fetch'

const PUBLIC_URL = new URL(process.env.SUPABASE_PUBLIC_URL || 'http://localhost:8000')

// Use LOGFLARE_URL until analytics/v1/ routing is supported
export const PROJECT_ANALYTICS_URL = `${process.env.LOGFLARE_URL}/api/`

export const PROJECT_REST_URL = `${PUBLIC_URL.origin}/rest/v1/`
export const PROJECT_ENDPOINT = PUBLIC_URL.host
export const PROJECT_ENDPOINT_PROTOCOL = PUBLIC_URL.protocol.replace(':', '')

export const DEFAULT_PROJECT = {
  id: 1,
  ref: 'default',
  name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
  organization_id: 1,
  cloud_provider: 'localhost',
  status: 'ACTIVE_HEALTHY',
  region: 'local',
  inserted_at: '2021-08-02T06:40:40.646Z',
}

/**
 * Used for extractResponse
 */
type FetchResponse<T> = {
  data: T extends {
    responses: any
  }
    ? NonNullable<FilterKeys<Success<T['responses']>, MediaType>>
    : unknown
  error?: never
  response: Response
}

/**
 * Utility type to extract the type from a API definition in data/api file.
 */
export type extractResponse<
  path extends keyof paths,
  method extends keyof paths[path],
> = FetchResponse<paths[path][method]>['data']
