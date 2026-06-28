import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import type { Content, Parent, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'
import { parse as parseToml } from 'smol-toml'

import { addBaseUrlPrefix } from './internal-links'
import { Admonition } from './markdown-schema/Admonition'
import { AuthProviders } from './markdown-schema/AuthProviders'
import { ComputeDiskLimitsTable } from './markdown-schema/ComputeDiskLimitsTable'
import { ErrorCodes } from './markdown-schema/ErrorCodes'
import { Link } from './markdown-schema/Link'
import { MetricsStackCards } from './markdown-schema/MetricsStackCards'
import { NavData } from './markdown-schema/NavData'
import { Panel } from './markdown-schema/Panel'
import { Price } from './markdown-schema/Price'
import { RealtimeLimitsEstimator } from './markdown-schema/RealtimeLimitsEstimator'
import { RegionsList, SmartRegionsList } from './markdown-schema/RegionsList'
import { SharedData } from './markdown-schema/SharedData'
import { StepHike } from './markdown-schema/StepHike'
import { TabPanel } from './markdown-schema/TabPanel'
import { collectMarkdownSources, type FrontmatterFormat } from './markdown-sources'

const PARTIALS_DIR = path.join(process.cwd(), 'content', '_partials')

type JsxNode = MdxJsxFlowElement | MdxJsxTextElement
type Props = Record<string, unknown>

/**
 * A handler converts a single MDX component into a markdown string. It receives
 * the component's props, the already-serialized markdown of its children, and
 * the raw AST node (escape hatch for handlers that need to inspect structure).
 *
 * Any component not in the schema is treated as `({ children }) => children`,
 * i.e. the wrapper is dropped and its children are kept as-is.
 */
type ComponentHandler = (ctx: { props: Props; children: string; node: JsxNode }) => string
type ComponentSchema = Record<string, ComponentHandler>

const PARSE_OPTIONS = {
  extensions: [mdxjs(), gfm()],
  mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
}
const SERIALIZE_OPTIONS = {
  extensions: [mdxToMarkdown(), gfmToMarkdown()],
  bullet: '-' as const,
  listItemIndent: 'one' as const,
}

const parseMdx = (source: string): Root => fromMarkdown(source, PARSE_OPTIONS)
const serializeMdx = (tree: Parent): string => toMarkdown(tree as Root, SERIALIZE_OPTIONS)

const defaultHandler: ComponentHandler = ({ children }) => children

const isJsx = (n: Content): n is JsxNode =>
  n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement'

function propsFrom(node: JsxNode): Props {
  const props: Props = {}
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') continue
    if (attr.value == null) props[attr.name] = true
    else if (typeof attr.value === 'string') props[attr.name] = attr.value
    else props[attr.name] = attr.value.value
  }
  return props
}

/**
 * Replaces every `<$Partial path="..." />` in the tree with the parsed AST of
 * the referenced file. Recurses so partials may include other partials.
 */
async function inlinePartials(parent: Parent): Promise<void> {
  const next: Content[] = []
  for (const child of parent.children as Content[]) {
    if (isJsx(child) && child.name === '$Partial') {
      const partialPath = String(propsFrom(child).path ?? '')
      try {
        const raw = await fs.readFile(path.join(PARTIALS_DIR, partialPath), 'utf8')
        const subtree = parseMdx(matter(raw).content)
        await inlinePartials(subtree)
        next.push(...(subtree.children as Content[]))
      } catch {
        // missing or broken partials are silently dropped
      }
      continue
    }
    if ('children' in child) await inlinePartials(child as Parent)
    next.push(child)
  }
  parent.children = next as Parent['children']
}

/**
 * Walks the tree bottom-up. For each JSX element, runs its schema handler (or
 * the default) and replaces the node with an `html` node holding the result.
 * The `html` type passes through `mdast-util-to-markdown` verbatim, so whatever
 * markdown the handler returns lands in the final output unchanged.
 */
function applySchema(parent: Parent, schema: ComponentSchema): void {
  for (const child of parent.children as Content[]) {
    if ('children' in child) applySchema(child as Parent, schema)
  }
  const next: Content[] = []
  for (const child of parent.children as Content[]) {
    if (
      child.type === 'mdxFlowExpression' ||
      child.type === 'mdxTextExpression' ||
      child.type === 'mdxjsEsm'
    ) {
      continue
    }
    if (isJsx(child)) {
      const handler = schema[child.name ?? ''] ?? defaultHandler
      const children = serializeMdx({
        type: 'root',
        children: child.children as Root['children'],
      }).trim()
      const value = handler({ props: propsFrom(child), children, node: child })
      next.push({ type: 'html', value } as Content)
      continue
    }
    next.push(child)
  }
  parent.children = next as Parent['children']
}

/**
 * Per-component overrides. Each handler receives `{ props, children, node }`
 * and returns the markdown string that should replace the JSX element. Any
 * component not listed is unwrapped (children are kept, wrapper is dropped).
 */
const SCHEMA: ComponentSchema = {
  Admonition,
  AuthProviders,
  ComputeDiskLimitsTable,
  ErrorCodes,
  Link,
  Price,
  GlassPanel: Panel,
  IconPanel: Panel,
  RealtimeLimitsEstimator,
  RegionsList,
  SmartRegionsList,
  ...StepHike,
  TabPanel,
  MetricsStackCards,
  NavData,
  SharedData,
}

function parseFrontmatter(raw: string, frontmatter: FrontmatterFormat) {
  if (frontmatter === 'toml') {
    return matter(raw, { language: 'toml', engines: { toml: parseToml } })
  }
  return matter(raw)
}

async function transformBody(content: string, data: Record<string, unknown>): Promise<string> {
  const tree = parseMdx(content)
  await inlinePartials(tree)
  addBaseUrlPrefix(tree)
  applySchema(tree, SCHEMA)
  const body = serializeMdx(tree)

  const headerParts: string[] = []
  if (data.title) headerParts.push(`# ${String(data.title)}`)
  if (data.subtitle) headerParts.push(String(data.subtitle))
  if (data.description && String(data.description) !== String(data.subtitle))
    headerParts.push(String(data.description))

  const header = headerParts.join('\n\n')

  return header ? `${header}\n\n${body}` : body
}

async function generateOne(sourceFile: string, frontmatter: FrontmatterFormat): Promise<string> {
  const raw = await fs.readFile(sourceFile, 'utf8')
  const { content, data } = parseFrontmatter(raw, frontmatter)
  return transformBody(content, data)
}

async function generate() {
  const sources = await collectMarkdownSources()
  let warnings = 0

  await Promise.all(
    sources.map(async ({ sourceFile, outPath, frontmatter }) => {
      let output: string
      try {
        output = await generateOne(sourceFile, frontmatter)
      } catch (err) {
        warnings++
        console.warn(
          `[warn] Failed to process ${sourceFile}: ${err instanceof Error ? err.message : err}`
        )
        try {
          output = await fs.readFile(sourceFile, 'utf8')
        } catch {
          output = `<!-- failed to generate: ${sourceFile} -->`
        }
      }

      await fs.mkdir(path.dirname(outPath), { recursive: true })
      await fs.writeFile(outPath, output)
    })
  )

  const summary = warnings ? ` (${warnings} with warnings)` : ''
  console.log(`Generated ${sources.length} markdown files under public/markdown/guides/${summary}`)
}

generate()
