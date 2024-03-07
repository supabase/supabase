import { createHash } from 'crypto'
import { ObjectExpression } from 'estree'
import { readFile } from 'fs/promises'
import GithubSlugger from 'github-slugger'
import matter from 'gray-matter'
import { Content, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { MdxjsEsm, mdxFromMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { toString } from 'mdast-util-to-string'
import { mdxjs } from 'micromark-extension-mdxjs'
import { u } from 'unist-builder'
import { filter } from 'unist-util-filter'
import { BaseLoader, BaseSource, Json, Section } from './base'

/**
 * Extracts ES literals from an `estree` `ObjectExpression`
 * into a plain JavaScript object.
 */
export function getObjectFromExpression(node: ObjectExpression) {
  return node.properties.reduce<
    Record<string, string | number | bigint | true | RegExp | undefined>
  >((object, property) => {
    if (property.type !== 'Property') {
      return object
    }

    const key = (property.key.type === 'Identifier' && property.key.name) || undefined
    const value = (property.value.type === 'Literal' && property.value.value) || undefined

    if (!key) {
      return object
    }

    return {
      ...object,
      [key]: value,
    }
  }, {})
}

/**
 * Extracts the `meta` ESM export from the MDX file.
 *
 * This info is akin to frontmatter.
 */
export function extractMetaExport(mdxTree: Root) {
  const metaExportNode = mdxTree.children.find((node): node is MdxjsEsm => {
    return (
      node.type === 'mdxjsEsm' &&
      node.data?.estree?.body[0]?.type === 'ExportNamedDeclaration' &&
      node.data.estree.body[0].declaration?.type === 'VariableDeclaration' &&
      node.data.estree.body[0].declaration.declarations[0]?.id.type === 'Identifier' &&
      node.data.estree.body[0].declaration.declarations[0].id.name === 'meta'
    )
  })

  if (!metaExportNode) {
    return undefined
  }

  const objectExpression =
    (metaExportNode.data?.estree?.body[0]?.type === 'ExportNamedDeclaration' &&
      metaExportNode.data.estree.body[0].declaration?.type === 'VariableDeclaration' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0]?.id.type === 'Identifier' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].id.name === 'meta' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].init?.type ===
        'ObjectExpression' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].init) ||
    undefined

  if (!objectExpression) {
    return undefined
  }

  return getObjectFromExpression(objectExpression)
}

/**
 * Splits a `mdast` tree into multiple trees based on
 * a predicate function. Will include the splitting node
 * at the beginning of each tree.
 *
 * Useful to split a markdown file into smaller sections.
 */
export function splitTreeBy(tree: Root, predicate: (node: Content) => boolean) {
  return tree.children.reduce<Root[]>((trees, node) => {
    const [lastTree] = trees.slice(-1)

    if (!lastTree || predicate(node)) {
      const tree: Root = u('root', [node])
      return trees.concat(tree)
    }

    lastTree.children.push(node)
    return trees
  }, [])
}

/**
 * Parses a markdown heading which can optionally
 * contain a custom anchor in the format:
 *
 * ```markdown
 * ### My Heading [#my-custom-anchor]
 * ```
 */
export function parseHeading(heading: string): { heading: string; customAnchor?: string } {
  const match = heading.match(/(.*) *\[#(.*)\]/)
  if (match) {
    const [, heading, customAnchor] = match
    return { heading, customAnchor }
  }
  return { heading }
}

/**
 * Processes MDX content for search indexing.
 * It extracts metadata, strips it of all JSX,
 * and splits it into sub-sections based on criteria.
 */
export function processMdxForSearch(_content: string, options?: { yaml?: boolean }): ProcessedMdx {
  const checksum = createHash('sha256').update(_content).digest('base64')

  let frontmatter: Record<string, unknown> = {}
  let content = _content
  if (options?.yaml) {
    const parsed = matter(_content)
    frontmatter = parsed.data
    content = parsed.content
  }

  const mdxTree = fromMarkdown(content, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  })

  let meta: Record<string, unknown>
  if (options?.yaml) {
    meta = frontmatter
  } else {
    meta = extractMetaExport(mdxTree)
  }

  const serializableMeta: Json = meta && JSON.parse(JSON.stringify(meta))

  // Remove all MDX elements from markdown
  const mdTree = filter(
    mdxTree,
    (node) =>
      ![
        'mdxjsEsm',
        'mdxJsxFlowElement',
        'mdxJsxTextElement',
        'mdxFlowExpression',
        'mdxTextExpression',
      ].includes(node.type)
  )

  if (!mdTree) {
    return {
      checksum,
      meta: serializableMeta,
      sections: [],
    }
  }

  const sectionTrees = splitTreeBy(mdTree, (node) => node.type === 'heading')

  const slugger = new GithubSlugger()

  const sections = sectionTrees.map((tree) => {
    const [firstNode] = tree.children
    const content = toMarkdown(tree)

    const rawHeading: string = firstNode.type === 'heading' ? toString(firstNode) : undefined

    if (!rawHeading) {
      return { content }
    }

    const { heading, customAnchor } = parseHeading(rawHeading)

    const slug = slugger.slug(customAnchor ?? heading)

    return {
      content,
      heading,
      slug,
    }
  })

  return {
    checksum,
    meta: serializableMeta,
    sections,
  }
}

export type ProcessedMdx = {
  checksum: string
  meta: Json
  sections: Section[]
}

export class MarkdownLoader extends BaseLoader {
  type = 'markdown' as const

  constructor(
    source: string,
    public filePath: string,
    public options?: { yaml?: boolean }
  ) {
    const path = filePath.replace(/^(pages|content)/, '').replace(/\.mdx?$/, '')
    super(source, path)
  }

  async load() {
    const contents = await readFile(this.filePath, 'utf8')
    return [new MarkdownSource(this.source, this.path, contents, this.options)]
  }
}

export class MarkdownSource extends BaseSource {
  type = 'markdown' as const

  constructor(
    source: string,
    path: string,
    public contents: string,
    public options?: { yaml?: boolean }
  ) {
    super(source, path)
  }

  process() {
    const { checksum, meta, sections } = processMdxForSearch(this.contents, this.options)

    this.checksum = checksum
    this.meta = meta
    this.sections = sections

    return { checksum, meta, sections }
  }

  extractIndexedContent(): string {
    const sections = this.sections ?? []
    return sections.map(({ content }) => content).join('\n\n')
  }
}
