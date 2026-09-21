import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'

import { addBaseUrlPrefix } from './internal-links'
import { Admonition } from './markdown-schema/Admonition'
import { Image } from './markdown-schema/Image'
import { Link } from './markdown-schema/Link'
import { TabPanel } from './markdown-schema/TabPanel'
import {
  applySchema,
  inlinePartials,
  parseMdx,
  serializeMdx,
  type ComponentHandler,
  type ComponentSchema,
} from './mdx-schema'

export const prefixMarkdownLinks = (markdown: string): string => {
  const tree = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })
  addBaseUrlPrefix(tree)
  return toMarkdown(tree, {
    extensions: [gfmToMarkdown()],
    bullet: '-',
    listItemIndent: 'one',
  })
}

type Example = {
  id?: string
  name?: string
  code?: string
  response?: string
  description?: string
  data?: { sql?: string }
}

type TypeSpecComment = { shortText?: string; text?: string; examples?: Example[] }

export type TypeSpecEntry = {
  name?: unknown
  params?: Array<{ name?: unknown; isOptional?: boolean; comment?: { shortText?: string } }>
  altSignatures?: Array<{ params?: TypeSpecEntry['params'] }>
  ret?: unknown
  comment?: TypeSpecComment
}

export type ReferenceFunction = {
  id: string
  $ref?: string
  title?: string
  description?: string
  notes?: string
  examples?: Example[]
  params?: Array<Record<string, unknown>>
  overwriteParams?: Array<Record<string, unknown>>
}

const joinBlocks = (parts: Array<string | undefined | null>): string =>
  parts
    .map((part) => part?.trim())
    .filter((part): part is string => !!part)
    .join('\n\n')

const heading = (level: number, text: string) => `${'#'.repeat(level)} ${text}`

// matches the bulk exporter's field format: `name` (type, required)
const field = (name: string, qualifiers: Array<string | false | undefined>) =>
  `\`${name}\` (${qualifiers.filter(Boolean).join(', ')})`

const hang = (text: string, indent = '  ') => text.trim().replace(/\n(?=.)/g, `\n${indent}`)

const renderParams = (fn: ReferenceFunction, types: TypeSpecEntry | undefined): string => {
  const authored = fn.overwriteParams ?? fn.params
  const params = authored ?? types?.params
  if (!params?.length) return ''

  const items = params.map((param) => {
    const record = param as Record<string, unknown>
    const name = typeof record.name === 'string' ? record.name : 'arg'
    const isOptional = record.isOptional === true || record.required === false
    const description =
      (typeof record.description === 'string' && record.description) ||
      (typeof (record.comment as { shortText?: string })?.shortText === 'string'
        ? (record.comment as { shortText?: string }).shortText
        : undefined)
    const line = `- ${field(name, [isOptional ? 'optional' : 'required'])}`
    return description?.trim() ? `${line}\n\n  ${hang(description)}` : line
  })

  return `${heading(3, 'Parameters')}\n\n${items.join('\n')}`
}

const renderExamples = (examples: Example[] | undefined): string => {
  if (!examples?.length) return ''
  const blocks = examples.map((example) => {
    const title = example.name ? heading(4, example.name) : ''
    return joinBlocks([
      title,
      example.code,
      example.data?.sql ? joinBlocks([heading(5, 'Data source'), example.data.sql]) : '',
      example.response ? joinBlocks([heading(5, 'Response'), example.response]) : '',
      example.description ? joinBlocks([heading(5, 'Notes'), example.description]) : '',
    ])
  })
  const body = blocks.filter(Boolean).join('\n\n')
  return body ? `${heading(3, 'Examples')}\n\n${body}` : ''
}

export const renderFunctionSection = ({
  title,
  fn,
  types,
  signature,
}: {
  title: string
  fn: ReferenceFunction
  types?: TypeSpecEntry
  signature?: string
}): string => {
  const description = joinBlocks([
    types?.comment?.shortText,
    types?.comment?.text,
    fn.description,
    fn.notes,
  ])

  const examples = fn.examples?.length ? fn.examples : types?.comment?.examples

  return joinBlocks([
    heading(1, title),
    signature ? '```ts\n' + signature + '\n```' : '',
    description,
    renderParams(fn, types),
    renderExamples(examples),
  ])
}

const img: ComponentHandler = (ctx) => {
  const { alt, src } = ctx.props
  if (!alt) return ''

  return String(src).startsWith('http') ? `![${alt}](${src})` : Image(ctx)
}

// Adds the raw HTML tags reference MDX uses, which the guides schema lacks.
const PROSE_SCHEMA: ComponentSchema = {
  Admonition,
  TabPanel,
  a: Link,
  img,
  h1: ({ children }) => `# ${children}`,
}

export const proseToMarkdown = async (
  content: string,
  { cliFlags = [] }: { cliFlags?: Array<Record<string, unknown>> } = {}
): Promise<string> => {
  const tree = parseMdx(content)
  await inlinePartials(tree)
  applySchema(tree, {
    ...PROSE_SCHEMA,
    CliGlobalFlagsHandler: () => renderCliGlobalFlags(cliFlags),
  })
  return serializeMdx(tree).trim()
}

export const renderCliGlobalFlags = (flags: Array<Record<string, unknown>>): string => {
  if (!flags.length) return ''
  const items = flags.map((flag) => {
    const name = typeof flag.name === 'string' ? flag.name : String(flag.id ?? '')
    const isOptional = flag.required === undefined ? true : !flag.required
    const line = `- ${field(name, [isOptional ? 'optional' : 'required'])}`
    const description = typeof flag.description === 'string' ? flag.description.trim() : ''
    return description ? `${line}\n\n  ${hang(description)}` : line
  })
  return `${heading(3, 'Flags')}\n\n${items.join('\n')}`
}

export type CliCommand = {
  id: string
  title?: string
  summary?: string
  description?: string
  usage?: string
  subcommands?: string[]
  flags?: Array<Record<string, unknown>>
  examples?: Example[]
}

export const renderCliCommand = ({
  command,
  subcommandTitles = {},
}: {
  command: CliCommand
  subcommandTitles?: Record<string, string>
}): string => {
  const subcommands = (command.subcommands ?? [])
    .filter((id) => id in subcommandTitles)
    .map((id) => `- [${subcommandTitles[id]}](/docs/reference/cli/${id})`)

  return joinBlocks([
    heading(1, command.title || command.summary || command.id),
    command.description,
    command.usage
      ? joinBlocks([heading(3, 'Usage'), '```sh\n' + command.usage.trim() + '\n```'])
      : '',
    subcommands.length ? joinBlocks([heading(3, 'Subcommands'), subcommands.join('\n')]) : '',
    renderCliGlobalFlags(command.flags ?? []),
    renderExamples(command.examples),
  ])
}

export type ApiSchema = {
  $ref?: string
  type?: string | string[]
  description?: string
  deprecated?: boolean
  enum?: unknown[]
  required?: string[] | boolean
  properties?: Record<string, ApiSchema>
  items?: ApiSchema
  oneOf?: ApiSchema[]
  anyOf?: ApiSchema[]
  allOf?: ApiSchema[]
}

export type ApiEndpoint = {
  id?: string
  path?: string
  method?: string
  summary?: string
  description?: string
  deprecated?: boolean
  parameters?: Array<Record<string, unknown>>
  requestBody?: { required?: boolean; content?: Record<string, { schema?: ApiSchema }> }
  responses?: Record<
    string,
    { description?: string; content?: Record<string, { schema?: ApiSchema }>; schema?: ApiSchema }
  >
  'x-oauth-scope'?: string
  'x-allowed-plans'?: string[]
  'x-fga-permissions'?: string[][]
}

const MAX_SCHEMA_DEPTH = 6

const enumNote = (schema: ApiSchema): string =>
  Array.isArray(schema.enum)
    ? ` Values: ${schema.enum.map((value) => `\`${String(value)}\``).join(', ')}.`
    : ''

const renderSchema = (schema: ApiSchema | undefined, depth = 0): string => {
  if (!schema) return ''

  const ref = schema.$ref
  if (typeof ref === 'string') return `${'  '.repeat(depth)}- See \`${ref.split('/').pop()}\``
  if (depth > MAX_SCHEMA_DEPTH) return `${'  '.repeat(depth)}- _(nested schema omitted)_`

  const indent = '  '.repeat(depth)
  const lines: string[] = []

  const isLeaf =
    !schema.properties && !schema.items && !schema.oneOf && !schema.anyOf && !schema.allOf
  if (isLeaf) {
    const type = Array.isArray(schema.type) ? schema.type.join(' | ') : (schema.type ?? 'any')
    const description =
      typeof schema.description === 'string' ? `: ${hang(schema.description, `${indent}  `)}` : ''
    // same order as a property line: description then values
    const values = schema.enum ? `${description ? '' : '.'}${enumNote(schema)}` : ''
    return `${indent}- ${type}${description}${values}`
  }

  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    const variants = schema[key]
    if (!Array.isArray(variants)) continue
    lines.push(`${indent}- ${key === 'allOf' ? 'All of:' : 'One of:'}`)
    for (const variant of variants) {
      lines.push(renderSchema(variant, depth + 1))
    }
  }

  if (schema.type === 'array' && schema.items) {
    lines.push(`${indent}- Array of:`)
    lines.push(renderSchema(schema.items, depth + 1))
  }

  const required = new Set(Array.isArray(schema.required) ? schema.required : [])

  for (const [name, property] of Object.entries(schema.properties ?? {})) {
    const type = typeof property.type === 'string' ? property.type : undefined
    const label = field(name, [
      type,
      required.has(name) ? 'required' : 'optional',
      property.deprecated === true && 'deprecated',
    ])
    const description =
      typeof property.description === 'string'
        ? `: ${hang(property.description, `${indent}  `)}`
        : ''
    const enumValues = enumNote(property)
    const propertyRef =
      typeof property.$ref === 'string' ? property.$ref.split('/').pop() : undefined
    const refNote = propertyRef ? ` See \`${propertyRef}\`.` : ''
    lines.push(`${indent}- ${label}${description}${enumValues}${refNote}`)

    const hasNested =
      property.properties || property.items || property.oneOf || property.anyOf || property.allOf
    if (hasNested) lines.push(renderSchema(property, depth + 1))
  }

  return lines.filter(Boolean).join('\n')
}

const jsonSchemaOf = (
  container: { content?: Record<string, { schema?: ApiSchema }>; schema?: ApiSchema } | undefined
): ApiSchema | undefined => container?.content?.['application/json']?.schema ?? container?.schema

export const renderApiOperation = ({
  endpoint,
  fallbackTitle,
}: {
  endpoint: ApiEndpoint
  fallbackTitle?: string
}): string => {
  const title = endpoint.summary || fallbackTitle || endpoint.id || 'Operation'
  const method = (endpoint.method ?? 'get').toUpperCase()

  const params = (endpoint.parameters ?? []) as Array<Record<string, unknown>>
  const renderParamGroup = (location: string, label: string): string => {
    const group = params.filter((param) => param.in === location)
    if (!group.length) return ''
    const items = group.map((param) => {
      const schema = param.schema as ApiSchema | undefined
      const type = typeof schema?.type === 'string' ? schema.type : undefined
      const description =
        typeof param.description === 'string' ? `: ${hang(param.description)}` : ''
      const label = field(String(param.name), [type, param.required ? 'required' : 'optional'])
      return `- ${label}${description}`
    })
    return joinBlocks([heading(3, label), items.join('\n')])
  }

  const requestBody =
    endpoint.requestBody ??
    params
      .filter((param) => param.in === 'body')
      .map((param) => ({
        content: { 'application/json': { schema: param.schema as ApiSchema } },
      }))[0]

  const bodySchema = jsonSchemaOf(requestBody)

  const permissionGroups = (endpoint['x-fga-permissions'] ?? [])
    .map((group) => group.map((permission) => `- \`${permission}\``).join('\n'))
    .join('\n\nor\n\n')

  const responseCodes = Object.keys(endpoint.responses ?? {})
  const successCode = responseCodes.filter((code) => code.startsWith('2')).sort()[0]
  const successSchema = successCode ? jsonSchemaOf(endpoint.responses?.[successCode]) : undefined

  return joinBlocks([
    heading(1, endpoint.deprecated ? `${title} (deprecated)` : title),
    '`' + `${method} ${endpoint.path ?? ''}`.trim() + '`',
    endpoint.description,
    endpoint['x-oauth-scope']
      ? joinBlocks([heading(3, 'OAuth scopes'), `- \`${endpoint['x-oauth-scope']}\``])
      : '',
    endpoint['x-allowed-plans']?.length
      ? joinBlocks([
          heading(3, 'Available on plans'),
          endpoint['x-allowed-plans'].map((plan) => `- \`${plan}\``).join('\n'),
        ])
      : '',
    permissionGroups ? joinBlocks([heading(3, 'Required permissions'), permissionGroups]) : '',
    renderParamGroup('path', 'Path parameters'),
    renderParamGroup('query', 'Query parameters'),
    bodySchema ? joinBlocks([heading(3, 'Request body'), renderSchema(bodySchema)]) : '',
    responseCodes.length
      ? joinBlocks([
          heading(3, 'Response codes'),
          responseCodes.map((code) => `- \`${code}\``).join('\n'),
        ])
      : '',
    successSchema
      ? joinBlocks([heading(3, `Response (${successCode})`), renderSchema(successSchema)])
      : '',
  ])
}

const indexUrl = (libPath: string, version: string, versions: readonly string[]) =>
  `/docs/reference/${libPath}${version === versions[0] || !versions.length ? '' : `/${version}`}`

/**
 * List every section of one family and version as links to its Markdown, so
 * a reader can find a section without downloading the whole library.
 */
export const renderFamilyIndex = ({
  name,
  libPath,
  version,
  versions,
  sections,
}: {
  name: string
  libPath: string
  version: string
  /** Registry versions, newest first. Empty for unversioned families. */
  versions: readonly string[]
  sections: Array<{ slug: string; title?: string }>
}): string => {
  const base = indexUrl(libPath, version, versions)
  const others = versions.filter((other) => other !== version)

  return joinBlocks([
    heading(1, `${name} reference${versions.length ? ` ${version}` : ''}`),
    sections.map(({ slug, title }) => `- [${title ?? slug}](${base}/${slug}.md)`).join('\n'),
    others.length
      ? joinBlocks([
          heading(2, 'Other versions'),
          others
            .map((other) => `- [${other}](${indexUrl(libPath, other, versions)}.md)`)
            .join('\n'),
        ])
      : '',
  ])
}

export const renderRootIndex = (families: Array<{ name: string; libPath: string }>): string =>
  joinBlocks([
    heading(1, 'Supabase reference'),
    families.map(({ name, libPath }) => `- [${name}](/docs/reference/${libPath}.md)`).join('\n'),
  ])
