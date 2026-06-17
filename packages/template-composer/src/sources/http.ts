import type { Template, TemplateSummary } from '../schema'
import { parseTemplateListResponse, parseTemplateResponse } from './http-schema'
import type { TemplateSource } from './types'

export interface HttpSourceOptions {
  /** Base URL of the registry, e.g. https://templates.supabase.com/v1 */
  baseUrl: string
  /** Override for environments without a global fetch, or to inject auth/retries. */
  fetcher?: typeof fetch
  /** Extra headers attached to every request. */
  headers?: Record<string, string>
  /** Forwarded to Next.js fetch (ignored elsewhere). */
  next?: { revalidate?: number; tags?: string[] }
}

export function createHttpSource({
  baseUrl,
  fetcher = fetch,
  headers,
  next,
}: HttpSourceOptions): TemplateSource {
  const normalizedBase = baseUrl.replace(/\/+$/, '')

  async function request(path: string): Promise<unknown> {
    const response = await fetcher(`${normalizedBase}${path}`, {
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      ...(next ? { next } : {}),
    } as RequestInit)

    if (!response.ok) {
      throw new Error(`Template registry request failed (${response.status}): ${path}`)
    }

    return response.json()
  }

  return {
    async list(): Promise<TemplateSummary[]> {
      return parseTemplateListResponse(await request('/templates'))
    },
    async get(id: string, version?: string): Promise<Template> {
      const suffix = version ? `/${encodeURIComponent(version)}` : ''
      return parseTemplateResponse(await request(`/templates/${encodeURIComponent(id)}${suffix}`))
    },
  }
}
