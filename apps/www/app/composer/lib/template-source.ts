import {
  createMockTemplateSource,
  mockTemplates,
  type Template,
  type TemplateSource,
} from './templates'

interface RepositoryTemplateSourceOptions {
  indexUrl: string
  fetcher?: typeof fetch
}

type TemplateIndexPayload = Template[] | { templates?: unknown }

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
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch project composer templates: ${response.status}`)
      }

      return parseTemplateIndex((await response.json()) as TemplateIndexPayload)
    },
  }
}

export function parseTemplateIndex(payload: TemplateIndexPayload): Template[] {
  const templates = Array.isArray(payload) ? payload : payload.templates

  if (!Array.isArray(templates)) {
    throw new Error('Project composer template index must contain a templates array')
  }

  return templates.map(parseTemplate)
}

function parseTemplate(value: unknown): Template {
  if (!isRecord(value)) {
    throw new Error('Project composer template must be an object')
  }

  const id = readString(value, 'id')
  const name = readString(value, 'name')
  const description = readString(value, 'description')
  const category = readString(value, 'category')
  const tags = readOptionalStringArray(value, 'tags')
  const filesValue = value.files

  if (!Array.isArray(filesValue)) {
    throw new Error(`Project composer template "${id}" must contain a files array`)
  }

  const dependencies = parseDependencies(value.dependencies, id)
  const defaultEnabled =
    typeof value.defaultEnabled === 'boolean' ? value.defaultEnabled : undefined

  return {
    id,
    name,
    description,
    category,
    tags,
    files: filesValue.map((file) => parseTemplateFile(file, id)),
    dependencies,
    defaultEnabled,
  }
}

function parseTemplateFile(value: unknown, templateId: string): Template['files'][number] {
  if (!isRecord(value)) {
    throw new Error(`Project composer file in template "${templateId}" must be an object`)
  }

  return {
    path: readString(value, 'path'),
    content: readString(value, 'content'),
  }
}

function parseDependencies(value: unknown, templateId: string): Template['dependencies'] {
  if (value === undefined) return undefined

  if (!isRecord(value)) {
    throw new Error(`Project composer dependencies in template "${templateId}" must be an object`)
  }

  return {
    required: readOptionalStringArray(value, 'required'),
    optional: readOptionalStringArray(value, 'optional'),
  }
}

function readString(value: Record<string, unknown>, key: string): string {
  const field = value[key]

  if (typeof field !== 'string' || field.trim().length === 0) {
    throw new Error(`Project composer template field "${key}" must be a non-empty string`)
  }

  return field
}

function readOptionalStringArray(
  value: Record<string, unknown>,
  key: string
): string[] | undefined {
  const field = value[key]

  if (field === undefined) return undefined

  if (!Array.isArray(field) || field.some((item) => typeof item !== 'string')) {
    throw new Error(`Project composer template field "${key}" must be an array of strings`)
  }

  return field
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
