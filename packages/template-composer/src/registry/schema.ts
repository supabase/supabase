import {
  parseTemplateSummary,
  type Template,
  type TemplateAuthor,
  type TemplateDependencies,
  type TemplateFile,
  type TemplateSummary,
} from '../schema'

export const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json'
export const REGISTRY_ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json'
export const REGISTRY_NAME = 'supabase-templates'
export const REGISTRY_HOMEPAGE = 'https://github.com/SaxonF/templates'
/** GitHub slug used in registryDependencies for same-repo installs. */
export const REGISTRY_GITHUB_SLUG = 'SaxonF/templates'

export interface RegistryFileRef {
  path: string
  type: string
  target?: string
  content?: string
}

export interface RegistryItemMeta {
  version?: string
  defaultEnabled?: boolean
  tags?: string[]
  category?: string
  license?: string
  repository?: string
  author?: TemplateAuthor
  dependencies?: TemplateDependencies
}

export interface RegistryItem {
  name: string
  type: string
  title?: string
  description?: string
  author?: string
  categories?: string[]
  registryDependencies?: string[]
  dependencies?: string[]
  devDependencies?: string[]
  files?: RegistryFileRef[]
  docs?: string
  meta?: RegistryItemMeta
}

export interface RegistryManifest {
  $schema?: string
  name?: string
  homepage?: string
  include?: string[]
  items?: RegistryItem[]
}

export interface ResolvedRegistry {
  items: RegistryItem[]
}

export function parseRegistryManifest(value: unknown): RegistryManifest {
  if (!isRecord(value)) {
    throw new Error('Registry manifest must be an object')
  }

  const include = readOptionalStringArray(value, 'include')
  const items = value.items === undefined ? undefined : parseRegistryItems(value.items)
  const name = readOptionalString(value, 'name')
  const homepage = readOptionalString(value, 'homepage')
  const $schema = readOptionalString(value, '$schema')

  if (!include?.length && !items?.length) {
    throw new Error('Registry manifest must declare items or include')
  }

  return {
    $schema,
    name,
    homepage,
    include,
    items,
  }
}

export function parseRegistryItem(value: unknown): RegistryItem {
  if (!isRecord(value)) {
    throw new Error('Registry item must be an object')
  }

  const name = readString(value, 'name')
  const type = readString(value, 'type')

  return {
    name,
    type,
    title: readOptionalString(value, 'title'),
    description: readOptionalString(value, 'description'),
    author: readOptionalString(value, 'author'),
    categories: readOptionalStringArray(value, 'categories'),
    registryDependencies: readOptionalStringArray(value, 'registryDependencies'),
    dependencies: readOptionalStringArray(value, 'dependencies'),
    devDependencies: readOptionalStringArray(value, 'devDependencies'),
    files: value.files === undefined ? undefined : parseRegistryFileRefs(value.files, name),
    docs: readOptionalString(value, 'docs'),
    meta: parseRegistryItemMeta(value.meta, name),
  }
}

export function isRegistryItemDocument(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false

  return (
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    value.items === undefined &&
    value.include === undefined
  )
}

export function registryItemToTemplateSummary(
  item: RegistryItem,
  registrySlug = REGISTRY_GITHUB_SLUG
): TemplateSummary {
  const meta = item.meta ?? {}
  const category = item.categories?.[0] ?? meta.category ?? 'Core'
  const author = meta.author ?? parseAuthorString(item.author)

  return parseTemplateSummary({
    id: item.name,
    name: item.title ?? item.name,
    description: item.description ?? '',
    category,
    version: meta.version ?? '1.0.0',
    tags: meta.tags,
    dependencies:
      meta.dependencies ?? registryDependenciesToTemplateDependencies(item, registrySlug),
    defaultEnabled: meta.defaultEnabled,
    author,
    repository: meta.repository,
    license: meta.license,
  })
}

export function buildTemplateFromRegistryItem(
  item: RegistryItem,
  files: TemplateFile[],
  readme?: string,
  registrySlug = REGISTRY_GITHUB_SLUG
): Template {
  const trimmedReadme = readme?.trim()

  return {
    ...registryItemToTemplateSummary(item, registrySlug),
    files,
    ...(trimmedReadme ? { readme: trimmedReadme } : {}),
  }
}

export function toRegistryDependencyRef(
  templateId: string,
  registrySlug = REGISTRY_GITHUB_SLUG
): string {
  return `${normalizeRegistrySlug(registrySlug)}/${templateId}`
}

export function parseRegistryDependencyRef(
  ref: string,
  registrySlug = REGISTRY_GITHUB_SLUG
): string {
  const normalized = stripRegistryRef(ref.trim())
  const normalizedRegistrySlug = normalizeRegistrySlug(registrySlug)

  if (normalized.startsWith(`${normalizedRegistrySlug}/`)) {
    return normalized.slice(normalizedRegistrySlug.length + 1)
  }

  return normalized
}

export function normalizeRegistrySlug(repository: string): string {
  const normalized = repository
    .trim()
    .replace(/^https:\/\/github\.com\//, '')
    .replace(/\/+$/, '')

  if (!/^[^/\s]+\/[^/\s]+$/.test(normalized)) {
    throw new Error(`GitHub template repository must be an owner/repo slug: ${repository}`)
  }

  return normalized
}

export function templateSummaryToRegistryItem({
  summary,
  fileRefs,
  docs,
}: {
  summary: TemplateSummary
  fileRefs: RegistryFileRef[]
  docs?: string
}): RegistryItem & { $schema: string } {
  const requiredDeps = summary.dependencies?.required ?? []
  const meta: RegistryItemMeta = {
    version: summary.version,
    defaultEnabled: summary.defaultEnabled,
    tags: summary.tags,
    category: summary.category,
    license: summary.license,
    repository: summary.repository,
    author: summary.author,
    dependencies: summary.dependencies,
  }

  return {
    $schema: REGISTRY_ITEM_SCHEMA,
    name: summary.id,
    type: 'registry:item',
    title: summary.name,
    description: summary.description,
    categories: [summary.category],
    registryDependencies: requiredDeps.map((templateId) => toRegistryDependencyRef(templateId)),
    files: fileRefs,
    ...(docs ? { docs } : {}),
    meta,
  }
}

export function createTemplateFileRefs(relativeFilePaths: string[]): RegistryFileRef[] {
  return relativeFilePaths.map((relativeFilePath) => {
    const targetPath = `supabase/${relativeFilePath}`

    return {
      path: targetPath,
      type: 'registry:file',
      target: `~/${targetPath}`,
    }
  })
}

export function normalizeRegistryTarget(target: string): string {
  return target.startsWith('~/') ? target.slice(2) : target
}

export function registryDependenciesToTemplateDependencies(
  item: RegistryItem,
  registrySlug = REGISTRY_GITHUB_SLUG
): TemplateDependencies | undefined {
  const required = (item.registryDependencies ?? [])
    .map((dependencyRef) => parseRegistryDependencyRef(dependencyRef, registrySlug))
    .filter(Boolean)

  if (required.length === 0) {
    return item.meta?.dependencies
  }

  return {
    required,
    optional: item.meta?.dependencies?.optional,
  }
}

function stripRegistryRef(value: string): string {
  const hashIndex = value.indexOf('#')
  return hashIndex === -1 ? value : value.slice(0, hashIndex)
}

function parseRegistryItems(value: unknown): RegistryItem[] {
  if (!Array.isArray(value)) {
    throw new Error('Registry items must be an array')
  }

  return value.map(parseRegistryItem)
}

function parseRegistryFileRefs(value: unknown, itemName: string): RegistryFileRef[] {
  if (!Array.isArray(value)) {
    throw new Error(`Registry item "${itemName}" files must be an array`)
  }

  return value.map((fileRef) => parseRegistryFileRef(fileRef, itemName))
}

function parseRegistryFileRef(value: unknown, itemName: string): RegistryFileRef {
  if (!isRecord(value)) {
    throw new Error(`Registry file in "${itemName}" must be an object`)
  }

  return {
    path: readString(value, 'path'),
    type: readString(value, 'type'),
    target: readOptionalString(value, 'target'),
    content: readOptionalString(value, 'content'),
  }
}

function parseRegistryItemMeta(value: unknown, itemName: string): RegistryItemMeta | undefined {
  if (value === undefined) return undefined

  if (!isRecord(value)) {
    throw new Error(`Registry item "${itemName}" meta must be an object`)
  }

  return {
    version: readOptionalString(value, 'version'),
    defaultEnabled: typeof value.defaultEnabled === 'boolean' ? value.defaultEnabled : undefined,
    tags: readOptionalStringArray(value, 'tags'),
    category: readOptionalString(value, 'category'),
    license: readOptionalString(value, 'license'),
    repository: readOptionalString(value, 'repository'),
    author: parseAuthorMeta(value.author, itemName),
    dependencies: parseDependenciesMeta(value.dependencies, itemName),
  }
}

function parseDependenciesMeta(value: unknown, itemName: string): TemplateDependencies | undefined {
  if (value === undefined) return undefined

  if (!isRecord(value)) {
    throw new Error(`Dependencies in registry item "${itemName}" must be an object`)
  }

  return {
    required: readOptionalStringArray(value, 'required'),
    optional: readOptionalStringArray(value, 'optional'),
  }
}

function parseAuthorMeta(value: unknown, itemName: string): TemplateAuthor | undefined {
  if (value === undefined) return undefined

  if (!isRecord(value)) {
    throw new Error(`Author in registry item "${itemName}" must be an object`)
  }

  return {
    name: readString(value, 'name'),
    url: readOptionalString(value, 'url'),
  }
}

function parseAuthorString(value: string | undefined): TemplateAuthor | undefined {
  if (!value) return undefined

  const match = value.match(/^(.+?)\s+<(.+)>$/)
  if (!match) {
    return { name: value }
  }

  return {
    name: match[1].trim(),
    url: match[2].trim(),
  }
}

function readString(value: Record<string, unknown>, key: string): string {
  const field = value[key]

  if (typeof field !== 'string' || field.trim().length === 0) {
    throw new Error(`Registry field "${key}" must be a non-empty string`)
  }

  return field
}

function readOptionalString(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key]

  if (field === undefined) return undefined

  if (typeof field !== 'string' || field.trim().length === 0) {
    throw new Error(`Registry field "${key}" must be a non-empty string when provided`)
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
    throw new Error(`Registry field "${key}" must be an array of strings`)
  }

  return field
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
