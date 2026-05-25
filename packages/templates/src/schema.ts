export interface ProjectComposerTemplateFile {
  path: string
  content: string
}

export interface ProjectComposerTemplateDependencies {
  required?: string[]
  optional?: string[]
}

export interface ProjectComposerTemplateMetadata {
  id: string
  name: string
  description: string
  category: string
  tags?: string[]
  dependencies?: ProjectComposerTemplateDependencies
  defaultEnabled?: boolean
}

export interface ProjectComposerTemplate extends ProjectComposerTemplateMetadata {
  files: ProjectComposerTemplateFile[]
}

export interface ProjectComposerTemplateIndex {
  templates: ProjectComposerTemplate[]
}

export interface ProjectComposerTemplateRegistry {
  templates: string[]
}

export function parseTemplateRegistry(value: unknown): ProjectComposerTemplateRegistry {
  if (!isRecord(value)) {
    throw new Error('Project composer template registry must be an object')
  }

  const templates = readStringArray(value, 'templates')
  const seenTemplateIds = new Set<string>()

  for (const templateId of templates) {
    if (seenTemplateIds.has(templateId)) {
      throw new Error(`Project composer template registry contains duplicate "${templateId}"`)
    }

    seenTemplateIds.add(templateId)
  }

  return { templates }
}

export function parseTemplateMetadata(value: unknown): ProjectComposerTemplateMetadata {
  if (!isRecord(value)) {
    throw new Error('Project composer template metadata must be an object')
  }

  const id = readString(value, 'id')
  const name = readString(value, 'name')
  const description = readString(value, 'description')
  const category = readString(value, 'category')
  const tags = readOptionalStringArray(value, 'tags')
  const dependencies = parseDependencies(value.dependencies, id)
  const defaultEnabled =
    typeof value.defaultEnabled === 'boolean' ? value.defaultEnabled : undefined

  return {
    id,
    name,
    description,
    category,
    tags,
    dependencies,
    defaultEnabled,
  }
}

export function createTemplateIndex(
  templates: ProjectComposerTemplate[]
): ProjectComposerTemplateIndex {
  return { templates }
}

function parseDependencies(
  value: unknown,
  templateId: string
): ProjectComposerTemplateDependencies | undefined {
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

function readStringArray(value: Record<string, unknown>, key: string): string[] {
  const field = value[key]

  if (!Array.isArray(field) || field.some((item) => typeof item !== 'string')) {
    throw new Error(`Project composer template field "${key}" must be an array of strings`)
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
