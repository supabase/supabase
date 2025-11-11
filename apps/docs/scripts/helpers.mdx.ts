import GithubSlugger from 'github-slugger'
import matter from 'gray-matter'
import { type Content, type Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toString } from 'mdast-util-to-string'
import { mdxjs } from 'micromark-extension-mdxjs'
import { u } from 'unist-builder'

type Section = {
  content: string
  heading?: string
  slug?: string
}

export type ProcessedMdx = {
  checksum: string
  meta: Record<string, unknown>
  sections: Section[]
}

async function createHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Process MDX content.
 *
 * Splits MDX content into sections based on headings, and calculates checksum.
 */
async function processMdx(content: string, options?: { yaml?: boolean }): Promise<ProcessedMdx> {
  const checksum = await createHash(content)

  let frontmatter: Record<string, unknown> = {}
  if (options?.yaml) {
    const parsed = matter(content)
    frontmatter = parsed.data
    content = parsed.content
  }

  const mdxTree = fromMarkdown(content, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  })

  const sectionTrees = splitTreeBy(mdxTree, (node) => node.type === 'heading')

  const slugger = new GithubSlugger()

  const sections = sectionTrees.map((tree) => {
    const [firstNode] = tree.children
    const content = toMarkdown(tree, {
      extensions: [mdxToMarkdown()],
    })

    const rawHeading: string | undefined =
      firstNode.type === 'heading' ? toString(firstNode) : undefined

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
    sections,
    meta: frontmatter,
  }
}

/**
 * Splits a `mdast` tree into multiple trees based on
 * a predicate function. Will include the splitting node
 * at the beginning of each tree.
 *
 * Useful to split a markdown file into smaller sections.
 */
function splitTreeBy(tree: Root, predicate: (node: Content) => boolean) {
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
function parseHeading(heading: string): { heading: string; customAnchor?: string } {
  const match = heading.match(/(.*) *\[#(.*)\]/)
  if (match) {
    const [, heading, customAnchor] = match
    return { heading, customAnchor }
  }
  return { heading }
}

export { processMdx }
export type { Section }
