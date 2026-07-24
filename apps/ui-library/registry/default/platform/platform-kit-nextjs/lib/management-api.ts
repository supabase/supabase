import createClient, { type Client } from 'openapi-fetch'

import type { paths } from '@/registry/default/platform/platform-kit-nextjs/lib/management-api-schema'

export type ManagementApiClient = Client<paths>

/**
 * Build an openapi-fetch client for the Supabase Management API.
 *
 * The kit ships no proxy — the consumer points `baseUrl` at their own trusted
 * transport (e.g. a serverless route that injects the Management API token and
 * enforces per-project permissions) so the token never reaches the browser.
 */
export function createManagementApiClient(opts: {
  baseUrl: string
  headers?: Record<string, string>
  fetch?: typeof fetch
}): ManagementApiClient {
  return createClient<paths>({
    baseUrl: opts.baseUrl,
    headers: opts.headers,
    fetch: opts.fetch,
  })
}
