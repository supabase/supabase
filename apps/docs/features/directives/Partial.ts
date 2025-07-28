/**
 * The Partial directive supports inclusion of content from a separate source
 * code file within the apps/docs/content/_partials directory. The content is
 * directly inlined into the page, and thus supports MDX components that would
 * be supported in inline MDX content.
 *
 * Simple string replacement is supported. The replacement strings are
 * specified using the `variables` field.
 *
 * ## Examples
 *
 * ### Simple partial
 *
 * ```mdx
 * <$Partial
 *    path="relative/path/from/partials/directory.mdx"
 * />
 * ```
 *
 * ### With string replacement
 *
 * Variables takes a JSON object with string values.
 *
 * ```mdx
 * <$Partial
 *    path="relative/path/from/partials/directory.mdx"
 *    variables={{ "product": "Auth" }}
 * />
 * ```
 *
 * ```mdx
 * Here is the partial content, with replacement of variable {{ .product }}
 * ```
 */

import { type Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { type Parent } from 'unist'
import { visitParents } from 'unist-util-visit-parents'

import { PARTIALS_DIRECTORY } from '~/lib/docs'
import { fromDocsMarkdown, getAttributeValue, getAttributeValueExpression } from './utils.server'

export function partialsRemark() {
  return async function transform(tree: Root) {
    while (true) {
      const contentMap = await fetchPartialsContent(tree)
      rewriteNodes(contentMap)
      if (contentMap.size === 0) {
        break
      }
    }
    return tree
  }
}

function isMdFile(path: string) {
  return path.endsWith('.md') || path.endsWith('.mdx')
}

function toFilePath(node: MdxJsxFlowElement) {
  const path = getAttributeValue(node, 'path')
  if (typeof path !== 'string' || !isMdFile(path)) {
    throw new Error('Invalid $Partial path: path must end with .mdx or .md')
  }
  const filePath = join(PARTIALS_DIRECTORY, path)
  if (!filePath.startsWith(PARTIALS_DIRECTORY)) {
    throw new Error(`Invalid $Partial path: Path must be inside ${PARTIALS_DIRECTORY}`)
  }
  return filePath
}

function substituteVars(content: string, vars: Record<string, string> | undefined) {
  if (vars === undefined) {
    return content
  }

  for (const [key, value] of Object.entries(vars)) {
    content = content.replace(new RegExp(`(?<!\\\\)\\{\\{\\s*\\.${key}\\s*\\}\\}`, 'g'), value)
  }
  return content
}

function getVariables(node: MdxJsxFlowElement): undefined | Record<string, string> {
  const variables = getAttributeValueExpression(getAttributeValue(node, 'variables'))
  if (variables === undefined) {
    return
  }

  try {
    const parsed = JSON.parse(variables)
    for (const value of Object.values(parsed)) {
      if (typeof value !== 'string') {
        throw new Error('Only string values are allowed')
      }
    }
    return parsed
  } catch {
    throw new Error('Invalid $Partial variables: must be valid JSON containing only string values')
  }
}

async function fetchPartialsContent(tree: Root) {
  // INVARIANT: These must be pushed to in the same order because the index is // used to keep track of the relationship.
  const partialNodes = [] as [Parent, MdxJsxFlowElement, undefined | Record<string, string>][]
  const pendingFetches = [] as Promise<string>[]

  visitParents(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, ancestors) => {
    if (node.name !== '$Partial') return

    const parent = ancestors[ancestors.length - 1]
    const filePath = toFilePath(node)
    const variables = getVariables(node)
    const fetchTask = readFile(filePath, 'utf-8')

    partialNodes.push([parent, node, variables])
    pendingFetches.push(fetchTask)
  })

  const resolvedContent = await Promise.all(pendingFetches)

  const nodeContentMap = new Map<
    MdxJsxFlowElement,
    [Parent, string, undefined | Record<string, string>]
  >()
  partialNodes.forEach(([parent, node, variables], index) => {
    nodeContentMap.set(node, [parent, resolvedContent[index], variables])
  })
  return nodeContentMap
}

function rewriteNodes(
  contentMap: Map<MdxJsxFlowElement, [Parent, string, undefined | Record<string, string>]>
) {
  for (const [node, [parent, rawContent, vars]] of contentMap) {
    let content = substituteVars(rawContent.trim(), vars)
    const replacementContent = fromDocsMarkdown(content)
    parent.children.splice(parent.children.indexOf(node), 1, replacementContent)
  }
}
