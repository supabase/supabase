import type { SafeSqlFragment } from '@supabase/pg-meta'

import { env } from '../env'

export type RunQueryOptions = {
  readOnly?: boolean
}

export type DeployFunctionInput = {
  slug: string
  name: string
  code: string
}

export type ManagementApi = {
  runQuery: (
    projectRef: string,
    sql: SafeSqlFragment,
    options?: RunQueryOptions
  ) => Promise<unknown>
  deployFunction: (projectRef: string, input: DeployFunctionInput) => Promise<unknown>
  getProject: (ref: string) => Promise<unknown>
  listOrganizations: () => Promise<unknown>
}

async function managementFetch(
  accessToken: string,
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<unknown> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${env.managementApiUrl}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.any([AbortSignal.timeout(30_000), ...(signal ? [signal] : [])]),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Management API ${response.status}: ${text}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text.length > 0 ? text : null
}

export function createManagementApi(accessToken: string, signal?: AbortSignal): ManagementApi {
  return {
    runQuery(projectRef, sql, options) {
      return managementFetch(
        accessToken,
        `/v1/projects/${encodeURIComponent(projectRef)}/database/query`,
        {
          method: 'POST',
          body: JSON.stringify({
            query: sql,
            read_only: options?.readOnly === true,
          }),
        },
        signal
      )
    },

    deployFunction(projectRef, { slug, name, code }) {
      const form = new FormData()
      form.append(
        'metadata',
        JSON.stringify({
          name,
          verify_jwt: true,
          entrypoint_path: 'index.ts',
        })
      )
      form.append('file', new Blob([code], { type: 'text/plain' }), 'index.ts')

      const path = `/v1/projects/${encodeURIComponent(projectRef)}/functions/deploy?slug=${encodeURIComponent(slug)}`
      return managementFetch(
        accessToken,
        path,
        {
          method: 'POST',
          body: form,
        },
        signal
      )
    },

    getProject(ref) {
      return managementFetch(accessToken, `/v1/projects/${encodeURIComponent(ref)}`, {}, signal)
    },

    listOrganizations() {
      return managementFetch(accessToken, '/v1/organizations', {}, signal)
    },
  }
}
