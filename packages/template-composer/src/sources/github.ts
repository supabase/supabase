import { queryTemplates, type SearchQuery } from '../operations/search'
import {
  buildTemplateFromRegistryItem,
  isRegistryItemDocument,
  normalizeRegistrySlug,
  normalizeRegistryTarget,
  parseRegistryItem,
  parseRegistryManifest,
  REGISTRY_GITHUB_SLUG,
  type RegistryItem,
} from '../registry/schema'
import { toTemplateSummary, type Template, type TemplateSummary } from '../schema'
import type { TemplateSource } from './types'

export const DEFAULT_GITHUB_TEMPLATE_REPOSITORY = REGISTRY_GITHUB_SLUG
export const DEFAULT_GITHUB_TEMPLATE_REF = 'main'

export interface GitHubTemplateSourceOptions {
  repository?: string
  ref?: string
  fetcher?: typeof fetch
  headers?: Record<string, string>
  next?: { revalidate?: number; tags?: string[] }
}

export interface GitHubTemplateSource extends TemplateSource {
  listTemplates(): Promise<Template[]>
}

interface ResolvedRegistryItem {
  item: RegistryItem
  registryDir: string
}

export function createGitHubTemplateSource({
  repository = DEFAULT_GITHUB_TEMPLATE_REPOSITORY,
  ref = DEFAULT_GITHUB_TEMPLATE_REF,
  fetcher = fetch,
  headers,
  next,
}: GitHubTemplateSourceOptions = {}): GitHubTemplateSource {
  const normalizedRepository = normalizeRegistrySlug(repository)
  let templatesPromise: Promise<Template[]> | undefined

  async function requestText(
    path: string
  ): Promise<{ content: string; ok: boolean; status: number }> {
    const response = await fetcher(createRawGitHubUrl(normalizedRepository, ref, path), {
      headers: {
        Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
        ...headers,
      },
      ...(next ? { next } : {}),
    } as RequestInit & { next?: GitHubTemplateSourceOptions['next'] })

    if (!response.ok) {
      return { content: '', ok: false, status: response.status }
    }

    return { content: await response.text(), ok: true, status: response.status }
  }

  async function requestRequiredJson(path: string): Promise<unknown> {
    const response = await requestText(path)

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub template registry "${path}": ${response.status}`)
    }

    return JSON.parse(response.content) as unknown
  }

  async function requestOptionalText(path: string): Promise<string | undefined> {
    const response = await requestText(path)

    if (!response.ok) {
      if (response.status === 404) return undefined
      throw new Error(`Failed to fetch GitHub template file "${path}": ${response.status}`)
    }

    const content = response.content.trim()
    return content.length > 0 ? content : undefined
  }

  async function resolveRegistry(
    registryPath: string,
    seenNames = new Set<string>()
  ): Promise<ResolvedRegistryItem[]> {
    const raw = await requestRequiredJson(registryPath)
    const registryDir = dirname(registryPath)

    if (isRegistryItemDocument(raw)) {
      const item = parseRegistryItem(raw)
      assertUniqueRegistryItem(item, seenNames)
      return [{ item, registryDir }]
    }

    const manifest = parseRegistryManifest(raw)
    const items: ResolvedRegistryItem[] = []

    for (const item of manifest.items ?? []) {
      assertUniqueRegistryItem(item, seenNames)
      items.push({ item, registryDir })
    }

    for (const includePath of manifest.include ?? []) {
      items.push(...(await resolveRegistry(joinRelativePath(registryDir, includePath), seenNames)))
    }

    return items
  }

  async function bundleRegistryItem({
    item,
    registryDir,
  }: ResolvedRegistryItem): Promise<Template> {
    const fileRefs = item.files ?? []

    if (fileRefs.length === 0) {
      throw new Error(`Registry item "${item.name}" must declare at least one file`)
    }

    const files = await Promise.all(
      fileRefs.map(async (fileRef) => ({
        path: normalizeRegistryTarget(fileRef.target ?? fileRef.path),
        content:
          fileRef.content ??
          (await requestRequiredText(joinRelativePath(registryDir, fileRef.path), item.name)),
      }))
    )

    const readme =
      item.docs ?? (await requestOptionalText(joinRelativePath(registryDir, 'readme.md')))

    return buildTemplateFromRegistryItem(item, files, readme, normalizedRepository)
  }

  async function requestRequiredText(path: string, itemName: string): Promise<string> {
    const response = await requestText(path)

    if (!response.ok) {
      throw new Error(
        `Failed to fetch file "${path}" for registry item "${itemName}": ${response.status}`
      )
    }

    return response.content
  }

  async function listTemplates(): Promise<Template[]> {
    templatesPromise ??= resolveRegistry('registry.json').then((items) =>
      Promise.all(items.map(bundleRegistryItem))
    )

    return templatesPromise
  }

  return {
    async listTemplates() {
      return listTemplates()
    },
    async list(): Promise<TemplateSummary[]> {
      return (await listTemplates()).map(toTemplateSummary)
    },
    async get(id: string): Promise<Template> {
      const template = (await listTemplates()).find((item) => item.id === id)

      if (!template) {
        throw new Error(`Template "${id}" not found in ${normalizedRepository}`)
      }

      return template
    },
    async search(query: SearchQuery): Promise<TemplateSummary[]> {
      return queryTemplates((await listTemplates()).map(toTemplateSummary), query)
    },
  }
}

function assertUniqueRegistryItem(item: RegistryItem, seenNames: Set<string>): void {
  if (seenNames.has(item.name)) {
    throw new Error(`Registry contains duplicate item "${item.name}"`)
  }

  seenNames.add(item.name)
}

function createRawGitHubUrl(repository: string, ref: string, path: string): string {
  const encodedPath = path
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/')

  return `https://raw.githubusercontent.com/${repository}/${encodeURIComponent(ref)}/${encodedPath}`
}

function dirname(path: string): string {
  const slashIndex = path.lastIndexOf('/')
  return slashIndex === -1 ? '' : path.slice(0, slashIndex)
}

function joinRelativePath(baseDir: string, relativePath: string): string {
  const parts: string[] = []

  for (const part of `${baseDir}/${relativePath}`.split('/')) {
    if (!part || part === '.') continue

    if (part === '..') {
      parts.pop()
      continue
    }

    parts.push(part)
  }

  return parts.join('/')
}
