import { parseTemplate, type Template } from 'templates'

import { createMockTemplateSource, mockTemplates, type TemplateSource } from '../template-catalog'

interface RepositoryTemplateSourceOptions {
  indexUrl: string
  fetcher?: typeof fetch
}

type TemplateIndexPayload = unknown

export function createStartTemplateSource(): TemplateSource {
  const repositoryIndexUrl = process.env.START_TEMPLATE_INDEX_URL

  if (repositoryIndexUrl) {
    return createRepositoryTemplateSource({ indexUrl: repositoryIndexUrl })
  }

  return createMockTemplateSource(mockTemplates)
}

export function createRepositoryTemplateSource({
  indexUrl,
  fetcher = fetch,
}: RepositoryTemplateSourceOptions): TemplateSource {
  return {
    async listTemplates() {
      const response = await fetcher(indexUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'supabase-start',
        },
        next: {
          revalidate: 3600,
        },
      } as RequestInit & { next?: { revalidate?: number } })

      if (!response.ok) {
        throw new Error(`Failed to fetch start templates: ${response.status}`)
      }

      return parseTemplateIndex((await response.json()) as TemplateIndexPayload)
    },
  }
}

/**
 * Parses a single-fetch payload that contains all full
 * templates (including file contents). This is distinct from the marketplace
 * `parseTemplateListResponse` in the templates package, which returns lightweight
 * summaries. Start needs the full payload upfront to render merge previews.
 */
export function parseTemplateIndex(payload: TemplateIndexPayload): Template[] {
  const templates = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.templates)
      ? payload.templates
      : null

  if (!templates) {
    throw new Error('Start template index must contain a templates array')
  }

  return templates.map(parseTemplate)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
