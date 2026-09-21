import fs from 'node:fs/promises'
import path from 'node:path'
import { REFERENCES } from '~/content/navigation.references'
import { SUPPORTS_NEW_REFERENCE_PROCESS } from '~/features/docs/Reference.constants'
import { formatMethodSignature, normalizeRefPath } from '~/features/docs/Reference.typeSpec'
import matter from 'gray-matter'
import { parse as parseYaml } from 'yaml'

import {
  buildCatalog,
  INDEX_ARTIFACT,
  type BySlugSection,
  type CatalogEntry,
} from './reference-catalog'
import {
  prefixMarkdownLinks,
  proseToMarkdown,
  renderApiOperation,
  renderCliCommand,
  renderFamilyIndex,
  renderFunctionSection,
  renderRootIndex,
  type ApiEndpoint,
  type CliCommand,
  type ReferenceFunction,
  type TypeSpecEntry,
} from './reference-markdown.utils'

const ROOT = process.cwd()
const GENERATED = path.join(ROOT, 'features/docs/generated')
const SECTIONS_DIR = path.join(ROOT, 'public/markdown/reference-sections')
const MANIFEST_PATH = path.join(ROOT, 'public/markdown/reference-manifest.json')
const MDX_ROOT = path.join(ROOT, 'docs/ref')

const toSdkId = (libraryId: string) => libraryId.replaceAll('_', '-')

const readJson = async <T>(filePath: string): Promise<T> =>
  JSON.parse(await fs.readFile(filePath, 'utf8')) as T

const generatedPath = (libraryId: string, version: string, name: string): string => {
  const sdkId = toSdkId(libraryId)
  if (SUPPORTS_NEW_REFERENCE_PROCESS.has(`${sdkId}-${version}`)) {
    return path.join(ROOT, 'content/reference', sdkId, version, `${name}.json`)
  }
  return path.join(GENERATED, `${sdkId}.${version}.${name}.json`)
}

const cache = new Map<string, Promise<unknown>>()
const cached = <T>(key: string, load: () => Promise<T>): Promise<T> => {
  if (!cache.has(key)) cache.set(key, load())
  return cache.get(key) as Promise<T>
}

const loadSectionsBySlug = async (libraryId: string, version: string) => {
  const data = await cached(`bySlug:${libraryId}:${version}`, () =>
    readJson<Record<string, BySlugSection>>(generatedPath(libraryId, version, 'bySlug'))
  )
  return new Map(Object.entries(data))
}

const loadFunctions = (libraryId: string, version: string) =>
  cached(`functions:${libraryId}:${version}`, () =>
    readJson<ReferenceFunction[]>(generatedPath(libraryId, version, 'functions'))
  )

const loadTypeSpec = (libraryId: string, version: string) =>
  cached(`typeSpec:${libraryId}:${version}`, async () => {
    try {
      return await readJson<{
        methods: Record<string, TypeSpecEntry>
        variables: Record<string, TypeSpecEntry>
      }>(generatedPath(libraryId, version, 'typeSpec'))
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { methods: {}, variables: {} }
      throw err
    }
  })

const loadCliSpec = () =>
  cached('cliSpec', async () =>
    parseYaml(await fs.readFile(path.join(ROOT, 'spec/cli_v1_commands.yaml'), 'utf8'))
  ) as Promise<{ commands?: CliCommand[]; flags?: Array<Record<string, unknown>> }>

const loadEndpoints = (libraryId: string) =>
  cached(`endpoints:${libraryId}`, async () => {
    const name = toSdkId(libraryId)
    const entries = await readJson<Array<[string, ApiEndpoint]>>(
      path.join(GENERATED, `${name}.latest.endpointsById.json`)
    )
    return new Map(entries)
  })

const prosePath = (entry: CatalogEntry): string =>
  entry.shared
    ? path.join(MDX_ROOT, 'shared', `${entry.sourceId}.mdx`)
    : path.join(
        MDX_ROOT,
        entry.libPath,
        entry.isLatestVersion ? '' : entry.version,
        `${entry.sourceId}.mdx`
      )

const renderProse = async (entry: CatalogEntry): Promise<string> => {
  const { content, data } = matter(await fs.readFile(prosePath(entry), 'utf8'))
  const cliSpec = entry.libPath === 'cli' ? await loadCliSpec() : undefined
  const body = await proseToMarkdown(content, { cliFlags: cliSpec?.flags })
  if (!body.trim()) throw new Error('prose file is empty')

  if (body.startsWith('# ')) return body
  const title = (typeof data.title === 'string' && data.title) || entry.title || entry.slug
  return `# ${title}\n\n${body}`
}

const renderFunction = async (entry: CatalogEntry): Promise<string> => {
  const functions = await loadFunctions(entry.libraryId, entry.version)
  const fn = functions.find((candidate) => candidate.id === entry.sourceId)
  if (!fn) throw new Error(`no function entry for id "${entry.sourceId}"`)

  let types: TypeSpecEntry | undefined
  if (REFERENCES[entry.libraryId]?.typeSpec && fn.$ref) {
    const spec = await loadTypeSpec(entry.libraryId, entry.version)
    const ref = normalizeRefPath(fn.$ref)
    types = spec.methods[ref] ?? spec.variables[ref]
  }

  const signature =
    types && Array.isArray(types.params)
      ? formatMethodSignature(types as Parameters<typeof formatMethodSignature>[0])
      : ''

  return renderFunctionSection({
    title: fn.title || entry.title || fn.id,
    fn,
    types,
    signature: signature || undefined,
  })
}

const renderCli = async (entry: CatalogEntry): Promise<string> => {
  const spec = await loadCliSpec()
  const commands = spec.commands ?? []
  const command = commands.find((candidate) => candidate.id === entry.sourceId)
  if (!command) throw new Error(`no CLI command for id "${entry.sourceId}"`)

  const subcommandTitles = Object.fromEntries(
    commands.map((candidate) => [candidate.id, candidate.title ?? candidate.id])
  )
  return renderCliCommand({ command, subcommandTitles })
}

const renderOperation = async (entry: CatalogEntry): Promise<string> => {
  const endpoints = await loadEndpoints(entry.libraryId)
  const endpoint = endpoints.get(entry.sourceId)
  if (!endpoint) throw new Error(`no endpoint for id "${entry.sourceId}"`)
  return renderApiOperation({ endpoint, fallbackTitle: entry.title })
}

const renderSection = async (entry: CatalogEntry): Promise<string> => {
  switch (entry.type) {
    case 'markdown':
      return renderProse(entry)
    case 'function':
      return renderFunction(entry)
    case 'cli-command':
      return renderCli(entry)
    case 'operation':
    case 'self-hosted-operation':
      return renderOperation(entry)
  }
}

export const generateSections = async (): Promise<void> => {
  const { entries, manifest } = await buildCatalog({
    loadSectionsBySlug,
    hasProse: (entry) =>
      fs.access(prosePath(entry)).then(
        () => true,
        () => false
      ),
    loadFunctionIds: async (libraryId, version) =>
      new Set((await loadFunctions(libraryId, version)).map((fn) => fn.id)),
  })

  const failures: string[] = []
  const rendered = new Map<string, string>()

  await Promise.all(
    entries.map(async (entry) => {
      try {
        const body = await renderSection(entry)
        if (!body.trim()) throw new Error('rendered empty')
        rendered.set(entry.artifact, prefixMarkdownLinks(body))
      } catch (err) {
        failures.push(`[${entry.artifact}] ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  )

  if (failures.length) {
    throw new Error(
      `Failed to generate ${failures.length} reference section(s):\n${failures.sort().join('\n')}`
    )
  }

  const families = new Map<string, CatalogEntry[]>()
  for (const entry of entries) {
    const key = `${entry.libPath}/${entry.version}`
    families.set(key, [...(families.get(key) ?? []), entry])
  }
  for (const [key, sections] of families) {
    const { libraryId, libPath, version } = sections[0]
    const { name, versions } = REFERENCES[libraryId]
    rendered.set(
      `${key}/${INDEX_ARTIFACT}`,
      prefixMarkdownLinks(renderFamilyIndex({ name, libPath, version, versions, sections }))
    )
  }
  const currentFamilies = [...families.values()]
    .filter(([first]) => first.isLatestVersion)
    .map(([{ libraryId, libPath }]) => ({ name: REFERENCES[libraryId].name, libPath }))
  rendered.set(INDEX_ARTIFACT, prefixMarkdownLinks(renderRootIndex(currentFamilies)))

  const missing = [...new Set(Object.values(manifest))].filter(
    (artifact) => !rendered.has(artifact)
  )
  if (missing.length) {
    throw new Error(
      `Manifest references ${missing.length} unrendered artifact(s): ${missing.join(', ')}`
    )
  }

  await fs.rm(SECTIONS_DIR, { recursive: true, force: true })
  await Promise.all(
    [...rendered].map(async ([artifact, body]) => {
      const filePath = path.join(SECTIONS_DIR, `${artifact}.md`)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, body)
    })
  )

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`)

  console.log(
    `Generated ${rendered.size} reference section files and ${Object.keys(manifest).length} manifest entries`
  )
}
