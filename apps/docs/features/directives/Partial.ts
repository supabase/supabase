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

/**
 * Extracts all variable names expected in the partial content.
 * Returns a Set of variable names found in {{ .variableName }} patterns.
 * Variable names can contain alphanumeric characters, hyphens, and underscores.
 */
function extractExpectedVariables(content: string): Set<string> {
  const variablePattern = /(?<!\\)\{\{\s*\.([\w-]+)\s*\}\}/g
  const variables = new Set<string>()
  let match

  while ((match = variablePattern.exec(content)) !== null) {
    variables.add(match[1])
  }

  return variables
}

/**
 * Validates that all expected variables are provided and no unexpected variables are included.
 * Throws descriptive errors if validation fails.
 */
function validateVariables(
  content: string,
  vars: Record<string, string> | undefined,
  partialPath: string
) {
  const expectedVars = extractExpectedVariables(content)
  const providedVars = vars ? new Set(Object.keys(vars)) : new Set<string>()

  // Check for missing variables
  const missingVars = [...expectedVars].filter((v) => !providedVars.has(v))
  if (missingVars.length > 0) {
    const varList = missingVars.map((v) => `"${v}"`).join(', ')
    const plural = missingVars.length > 1
    throw new Error(
      `Missing required variable${plural ? 's' : ''} in $Partial "${partialPath}": ${varList}\n` +
        `Expected variable${expectedVars.size > 1 ? 's' : ''}: ${[...expectedVars].map((v) => `"${v}"`).join(', ')}\n` +
        `Provided variable${providedVars.size !== 1 ? 's' : ''}: ${providedVars.size > 0 ? [...providedVars].map((v) => `"${v}"`).join(', ') : 'none'}`
    )
  }

  // Check for unexpected variables
  const unexpectedVars = [...providedVars].filter((v) => !expectedVars.has(v))
  if (unexpectedVars.length > 0) {
    const varList = unexpectedVars.map((v) => `"${v}"`).join(', ')
    const plural = unexpectedVars.length > 1
    throw new Error(
      `Unexpected variable${plural ? 's' : ''} in $Partial "${partialPath}": ${varList}\n` +
        `Expected variable${expectedVars.size !== 1 ? 's' : ''}: ${expectedVars.size > 0 ? [...expectedVars].map((v) => `"${v}"`).join(', ') : 'none'}\n` +
        `Provided variable${plural ? 's' : ''}: ${[...providedVars].map((v) => `"${v}"`).join(', ')}`
    )
  }
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
  const partialNodes = [] as [
    Parent,
    MdxJsxFlowElement,
    undefined | Record<string, string>,
    string,
  ][]
  const pendingFetches = [] as Promise<string>[]

  visitParents(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, ancestors) => {
    if (node.name !== '$Partial') return

    const parent = ancestors[ancestors.length - 1]
    const filePath = toFilePath(node)
    const variables = getVariables(node)
    const fetchTask = readFile(filePath, 'utf-8')
    const partialPath = getAttributeValue(node, 'path') as string

    partialNodes.push([parent, node, variables, partialPath])
    pendingFetches.push(fetchTask)
  })

  const resolvedContent = await Promise.all(pendingFetches)

  const nodeContentMap = new Map<
    MdxJsxFlowElement,
    [Parent, string, undefined | Record<string, string>, string]
  >()
  partialNodes.forEach(([parent, node, variables, partialPath], index) => {
    nodeContentMap.set(node, [parent, resolvedContent[index], variables, partialPath])
  })
  return nodeContentMap
}

function rewriteNodes(
  contentMap: Map<MdxJsxFlowElement, [Parent, string, undefined | Record<string, string>, string]>
) {
  for (const [node, [parent, rawContent, vars, partialPath]] of contentMap) {
    const trimmedContent = rawContent.trim()
    validateVariables(trimmedContent, vars, partialPath)
    let content = substituteVars(trimmedContent, vars)
    const replacementContent = fromDocsMarkdown(content)
    parent.children.splice(parent.children.indexOf(node), 1, replacementContent)
  }
}
