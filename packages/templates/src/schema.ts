export interface TemplateFile {
  path: string
  content: string
}

export interface TemplateDependencies {
  required?: string[]
  optional?: string[]
}

export interface TemplateAuthor {
  name: string
  url?: string
}

export interface TemplateSummary {
  id: string
  name: string
  description: string
  category: string
  version: string
  tags?: string[]
  dependencies?: TemplateDependencies
  defaultEnabled?: boolean
  author?: TemplateAuthor
  repository?: string
  license?: string
}

export interface Template extends TemplateSummary {
  files: TemplateFile[]
  readme?: string
}

export interface TemplateIndex {
  templates: Template[]
}

export interface TemplateRegistry {
  templates: string[]
}

export function parseTemplateRegistry(value: unknown): TemplateRegistry {
  if (!isRecord(value)) {
    throw new Error('Template registry must be an object')
  }

  const templates = readStringArray(value, 'templates')
  const seenTemplateIds = new Set<string>()

  for (const templateId of templates) {
    if (seenTemplateIds.has(templateId)) {
      throw new Error(`Template registry contains duplicate "${templateId}"`)
    }

    seenTemplateIds.add(templateId)
  }

  return { templates }
}

export function parseTemplateSummary(value: unknown): TemplateSummary {
  if (!isRecord(value)) {
    throw new Error('Template metadata must be an object')
  }

  const id = readString(value, 'id')
  const name = readString(value, 'name')
  const description = readString(value, 'description')
  const category = readString(value, 'category')
  const version = readString(value, 'version')
  const tags = readOptionalStringArray(value, 'tags')
  const dependencies = parseDependencies(value.dependencies, id)
  const defaultEnabled =
    typeof value.defaultEnabled === 'boolean' ? value.defaultEnabled : undefined
  const author = parseAuthor(value.author, id)
  const repository = readOptionalString(value, 'repository')
  const license = readOptionalString(value, 'license')

  return {
    id,
    name,
    description,
    category,
    version,
    tags,
    dependencies,
    defaultEnabled,
    author,
    repository,
    license,
  }
}

export function parseTemplate(value: unknown): Template {
  const summary = parseTemplateSummary(value)

  if (!isRecord(value)) {
    throw new Error('Template must be an object')
  }

  const filesValue = value.files

  if (!Array.isArray(filesValue)) {
    throw new Error(`Template "${summary.id}" must contain a files array`)
  }

  const readme = typeof value.readme === 'string' ? value.readme : undefined

  return {
    ...summary,
    files: filesValue.map((file) => parseTemplateFile(file, summary.id)),
    readme,
  }
}

export function createTemplateIndex(templates: Template[]): TemplateIndex {
  return { templates }
}

export function toTemplateSummary(template: Template): TemplateSummary {
  const { files: _files, readme: _readme, ...summary } = template
  return summary
}

function parseTemplateFile(value: unknown, templateId: string): TemplateFile {
  if (!isRecord(value)) {
    throw new Error(`Template file in "${templateId}" must be an object`)
  }

  return {
    path: readString(value, 'path'),
    content: readString(value, 'content'),
  }
}

function parseDependencies(value: unknown, templateId: string): TemplateDependencies | undefined {
  if (value === undefined) return undefined

  if (!isRecord(value)) {
    throw new Error(`Dependencies in template "${templateId}" must be an object`)
  }

  return {
    required: readOptionalStringArray(value, 'required'),
    optional: readOptionalStringArray(value, 'optional'),
  }
}

function parseAuthor(value: unknown, templateId: string): TemplateAuthor | undefined {
  if (value === undefined) return undefined

  if (!isRecord(value)) {
    throw new Error(`Author in template "${templateId}" must be an object`)
  }

  return {
    name: readString(value, 'name'),
    url: readOptionalString(value, 'url'),
  }
}

function readString(value: Record<string, unknown>, key: string): string {
  const field = value[key]

  if (typeof field !== 'string' || field.trim().length === 0) {
    throw new Error(`Template field "${key}" must be a non-empty string`)
  }

  return field
}

function readOptionalString(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key]

  if (field === undefined) return undefined

  if (typeof field !== 'string' || field.trim().length === 0) {
    throw new Error(`Template field "${key}" must be a non-empty string when provided`)
  }

  return field
}

function readStringArray(value: Record<string, unknown>, key: string): string[] {
  const field = value[key]

  if (!Array.isArray(field) || field.some((item) => typeof item !== 'string')) {
    throw new Error(`Template field "${key}" must be an array of strings`)
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
    throw new Error(`Template field "${key}" must be an array of strings`)
  }

  return field
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
