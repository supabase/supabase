import { parseTemplate, type Template } from 'templates'

import { createMockTemplateSource, mockTemplates, type TemplateSource } from './templates'

interface RepositoryTemplateSourceOptions {
  indexUrl: string
  fetcher?: typeof fetch
}

type TemplateIndexPayload = unknown

export function createProjectComposerTemplateSource(): TemplateSource {
  const repositoryIndexUrl = process.env.PROJECT_COMPOSER_TEMPLATE_INDEX_URL

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
          'User-Agent': 'supabase-www-composer',
        },
        next: {
          revalidate: 3600,
        },
      } as RequestInit & { next?: { revalidate?: number } })

      if (!response.ok) {
        throw new Error(`Failed to fetch project composer templates: ${response.status}`)
      }

      return parseTemplateIndex((await response.json()) as TemplateIndexPayload)
    },
  }
}

/**
 * Composer-specific: parses a single-fetch payload that contains all full
 * templates (including file contents). This is distinct from the marketplace
 * `parseTemplateListResponse` in the templates package, which returns lightweight
 * summaries. Composer needs the full payload upfront to render merge previews.
 */
export function parseTemplateIndex(payload: TemplateIndexPayload): Template[] {
  const templates = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.templates)
      ? payload.templates
      : null

  if (!templates) {
    throw new Error('Project composer template index must contain a templates array')
  }

  return templates.map(parseTemplate)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
