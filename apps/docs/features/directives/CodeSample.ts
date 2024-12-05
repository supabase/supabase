/**
 * The $CodeSample directive supports inclusion of code samples from a source
 * code file, which may be internal to this repo or external from another
 * GitHub repo.
 *
 * The syntax for internal references is:
 *
 * ```mdx
 * <$CodeSample
 *   path="/path/to/file.ts"
 *   lines={[1, 2], [5, 7]} // -1 may be used in end position as an alias for the last line, e.g., [1, -1]
 *   meta="utils/client.ts" // Optional, for displaying a file path on the code block
 * />
 * ```
 *
 * The syntax for external references is:
 *
 * ```mdx
 * <$CodeSample
 *   external={true} // Note you must set the boolean, React pattern of omitting for true doesn't work
 *   org="supabase"
 *   repo="wrappers"
 *   commit="68d5s42hvs7p342kl65ldk90dsafdsa"
 *   path="/path/to/file.ts"
 *   lines={[1, 2], [5, 7]} // -1 may be used in end position as an alias for the last line, e.g., [1, -1]
 *   meta="utils/client.ts" // Optional, for displaying a file path on the code block
 * />
 */

import * as acorn from 'acorn'
import tsPlugin from 'acorn-typescript'
import { type BlockContent, type Code, type Root } from 'mdast'
import type {
  MdxJsxAttribute,
  MdxJsxAttributeValueExpression,
  MdxJsxExpressionAttribute,
  MdxJsxFlowElement,
  MdxJsxFlowElementHast,
  MdxJsxTextElement,
  MdxJsxTextElementHast,
} from 'mdast-util-mdx-jsx'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { type Parent } from 'unist'
import { visitParents } from 'unist-util-visit-parents'
import { z, type SafeParseError } from 'zod'

import { fetchWithNextOptions } from '~/features/helpers.fetch'
import { IS_PLATFORM } from '~/lib/constants'
import { EXAMPLES_DIRECTORY } from '~/lib/docs'

const ALLOW_LISTED_GITHUB_ORGS = ['supabase', 'supabase-community'] as [string, ...string[]]

const linesSchema = z.array(z.tuple([z.coerce.number(), z.coerce.number()]))
const linesValidator = z
  .string()
  .default('[[1, -1]]')
  .transform((v, ctx) => {
    try {
      const array = JSON.parse(v)
      return linesSchema.parse(array)
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Lines should be an array of [number, number] tuples',
      })
      return z.NEVER
    }
  })

type AdditionalMeta = {
  parent: Parent
  codeHikeAncestor: Parent | null
  codeHikeAncestorParent: Parent | null
}

const codeSampleExternalSchema = z.object({
  external: z.coerce.boolean().refine((v) => v === true),
  org: z.enum(ALLOW_LISTED_GITHUB_ORGS, {
    errorMap: () => ({ message: 'Org must be one of: ' + ALLOW_LISTED_GITHUB_ORGS.join(', ') }),
  }),
  repo: z.string(),
  commit: z.string(),
  path: z.string().transform((v) => (v.startsWith('/') ? v : `/${v}`)),
  lines: linesValidator,
  meta: z.string().optional(),
})
type ICodeSampleExternal = z.infer<typeof codeSampleExternalSchema> & AdditionalMeta

const codeSampleInternalSchema = z.object({
  external: z.coerce
    .boolean()
    .refine((v) => v === false)
    .optional(),
  path: z.string().transform((v) => (v.startsWith('/') ? v : `/${v}`)),
  lines: linesValidator,
  meta: z.string().optional(),
})
type ICodeSampleInternal = z.infer<typeof codeSampleInternalSchema> & AdditionalMeta

type CodeSampleMeta = ICodeSampleExternal | ICodeSampleInternal

function isExternalSource(meta: CodeSampleMeta): meta is ICodeSampleExternal {
  return !!meta.external
}

interface Dependencies {
  fetchFromGitHub: (params: {
    org: string
    repo: string
    path: string
    branch: string
    options: { onError: (error: unknown) => void; fetch: (url: string) => Promise<Response> }
  }) => Promise<string>
}

export function codeSampleRemark(deps: Dependencies) {
  return async function transform(tree: Root) {
    const contentMap = await fetchSourceCodeContent(tree, deps)
    rewriteNodes(contentMap)

    return tree
  }
}

async function fetchSourceCodeContent(tree: Root, deps: Dependencies) {
  const codeSampleNodes = [] as MdxJsxFlowElement[]
  const metadata = [] as CodeSampleMeta[]
  const pendingFetches = [] as Promise<string>[]

  visitParents(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, ancestors) => {
    if (node.name !== '$CodeSample') return

    const codeHikeAncestorIndex = ancestors.findLastIndex(
      (ancestor) => ancestor.type === 'mdxJsxFlowElement' && ancestor.name === 'CH.Code'
    )
    const codeHikeAncestor = codeHikeAncestorIndex === -1 ? null : ancestors[codeHikeAncestorIndex]
    const codeHikeAncestorParent =
      codeHikeAncestorIndex <= 0 ? null : ancestors[codeHikeAncestorIndex - 1]
    const parent = ancestors[ancestors.length - 1]

    const isExternal = getAttributeValueExpression(getAttributeValue(node, 'external')) === 'true'

    if (isExternal) {
      if (!IS_PLATFORM) {
        node.name = 'CodeSampleDummy'
        node.attributes = []
        return
      }

      const org = getAttributeValue(node, 'org')
      const repo = getAttributeValue(node, 'repo')
      const commit = getAttributeValue(node, 'commit')
      const path = getAttributeValue(node, 'path')
      const lines = getAttributeValueExpression(getAttributeValue(node, 'lines'))
      const meta = getAttributeValue(node, 'meta')

      const result = codeSampleExternalSchema.safeParse({
        external: isExternal,
        org,
        repo,
        commit,
        path,
        lines,
        meta,
      })

      if (!result.success) {
        throw new Error(
          `Invalid $CodeSample directive: ${(result as SafeParseError<ICodeSampleExternal>).error.message}`
        )
      }

      const fetchTask = deps.fetchFromGitHub({
        org: result.data.org,
        repo: result.data.repo,
        path: result.data.path,
        branch: result.data.commit,
        options: {
          onError: (error: unknown) => {
            throw Error(
              `Failed to fetch code sample from ${org}/${repo}@${commit} at path ${path}: ${error}`
            )
          },
          fetch: fetchWithNextOptions({ cache: 'force-cache' }),
        },
      })

      codeSampleNodes.push(node)
      metadata.push({ ...result.data, parent, codeHikeAncestor, codeHikeAncestorParent })
      pendingFetches.push(fetchTask)
    } else {
      const path = getAttributeValue(node, 'path')
      const lines = getAttributeValueExpression(getAttributeValue(node, 'lines'))
      const meta = getAttributeValue(node, 'meta')

      const result = codeSampleInternalSchema.safeParse({
        external: isExternal,
        path,
        lines,
        meta,
      })

      if (!result.success) {
        throw new Error(
          `Invalid $CodeSample directive: ${(result as SafeParseError<ICodeSampleInternal>).error.message}`
        )
      }

      const filePath = join(EXAMPLES_DIRECTORY, result.data.path)
      if (!filePath.startsWith(EXAMPLES_DIRECTORY)) {
        throw new Error(`Invalid $CodeSample settings: Path must be inside ${EXAMPLES_DIRECTORY}`)
      }
      const fetchTask = readFile(filePath, 'utf-8')

      codeSampleNodes.push(node)
      metadata.push({ ...result.data, parent, codeHikeAncestor, codeHikeAncestorParent })
      pendingFetches.push(fetchTask)
    }
  })

  const resolvedContent = await Promise.all(pendingFetches)

  const nodeContentMap = new Map<MdxJsxFlowElement, [CodeSampleMeta, string]>()
  codeSampleNodes.forEach((node, index) => {
    nodeContentMap.set(node, [metadata[index], resolvedContent[index]])
  })

  return nodeContentMap
}

function getAttributeValue(
  node: MdxJsxFlowElement | MdxJsxFlowElementHast | MdxJsxTextElement | MdxJsxTextElementHast,
  attributeName: string
) {
  return (
    node.attributes.find(
      (attr: MdxJsxAttribute | MdxJsxExpressionAttribute) =>
        'name' in attr && attr.name === attributeName
    )?.value ?? undefined
  )
}

function getAttributeValueExpression(node: MdxJsxAttributeValueExpression | string | undefined) {
  if (typeof node === 'string' || node?.type !== 'mdxJsxAttributeValueExpression') return undefined
  return node.value
}

function rewriteNodes(contentMap: Map<MdxJsxFlowElement, [CodeSampleMeta, string]>) {
  for (const [node, [meta, content]] of contentMap) {
    const lang = matchLang(meta.path.split('.').pop())

    const source = isExternalSource(meta)
      ? `https://github.com/${meta.org}/${meta.repo}/blob/${meta.commit}${meta.path}`
      : `https://github.com/supabase/supabase/blob/${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'master'}/examples${meta.path}`

    const elidedContent = redactLines(content, meta.lines, lang)

    const replacementContent: MdxJsxFlowElement | Code = meta.codeHikeAncestor
      ? {
          type: 'code',
          lang,
          meta: meta.meta,
          value: elidedContent,
        }
      : {
          type: 'mdxJsxFlowElement',
          name: 'CodeSampleWrapper',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'source',
              value: source,
            },
          ],
          children: [
            {
              type: 'code',
              lang,
              meta: meta.meta,
              value: elidedContent,
            },
          ],
        }
    meta.parent.children.splice(meta.parent.children.indexOf(node), 1, replacementContent)

    if (meta.codeHikeAncestor && meta.codeHikeAncestorParent) {
      const existingWrapper = meta.codeHikeAncestorParent.children.find(
        (child) =>
          child.type === 'mdxJsxFlowElement' &&
          (child as MdxJsxFlowElement).name === 'CodeSampleWrapper' &&
          (child as MdxJsxFlowElement).children?.[0] === meta.codeHikeAncestor
      ) as MdxJsxFlowElement | undefined
      if (existingWrapper) {
        const existingSource = getAttributeValue(existingWrapper, 'source')
        if (typeof existingSource === 'string' && existingSource !== source) {
          const newSource = createArrayAttributeValueExpression(existingSource, source)
          existingWrapper.attributes[0].value = newSource
        } else if (
          typeof existingSource !== 'string' &&
          existingSource.type === 'mdxJsxAttributeValueExpression'
        ) {
          const existingSourceArray =
            // @ts-ignore
            existingSource.data.estree.body[0]?.expression?.elements?.map(
              (element) => element.value
            ) ?? []
          const newSource = createArrayAttributeValueExpression(...existingSourceArray, source)
          existingWrapper.attributes[0].value = newSource
        }
      } else {
        const codeSampleWrapper: MdxJsxFlowElement = {
          type: 'mdxJsxFlowElement',
          name: 'CodeSampleWrapper',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'source',
              value: source,
            },
          ],
          children: [meta.codeHikeAncestor as BlockContent],
        }
        meta.codeHikeAncestorParent.children.splice(
          meta.codeHikeAncestorParent.children.indexOf(meta.codeHikeAncestor),
          1,
          codeSampleWrapper
        )
      }
    }
  }
}

function matchLang(lang: string) {
  switch (lang) {
    case 'tsx':
      return 'tsx'
    case 'ts':
      return 'typescript'
    case 'jsx':
      return 'jsx'
    case 'js':
      return 'javascript'
    case 'json':
      return 'json'
    case 'py':
      return 'python'
    case 'sh':
      return 'bash'
    case 'kt':
      return 'kotlin'
    case 'dart':
      return 'dart'
    case 'swift':
      return 'swift'
    case 'sql':
      return 'sql'
    default:
      return null
  }
}

function redactLines(
  content: string,
  lines: [number, number, ...unknown[]][],
  lang: string | null
) {
  const contentLines = content.split('\n')
  const preservedLines = lines.reduce((acc, [start, end], index, arr) => {
    if (index !== 0 || start !== 1) {
      acc.push(_createElidedLine(lang, contentLines, start, end))
    }

    // Start and end are 1-indexed and inclusive
    acc.push(...contentLines.slice(start - 1, end === -1 ? contentLines.length : end))

    if (index === arr.length - 1 && end !== -1 && end !== contentLines.length) {
      acc.push(_createElidedLine(lang, contentLines, start, end))
    }

    return acc
  }, [] as string[])

  return preservedLines.join('\n').trim()
}

export function _createElidedLine(
  lang: string | null,
  lines: string[],
  start: number,
  end: number
) {
  const indentation = lines[start - 1].match(/^\s*/)?.[0] ?? ''

  switch (lang) {
    case 'sql':
      return `\n${indentation}-- ...\n`
    case 'jsx':
    case 'tsx':
      // @ts-ignore
      const acornTree = acorn.Parser.extend(tsPlugin()).parse(lines.join('\n'), {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
      })
      const isWithinJsx = isContainedInJsx(acornTree, start)
      if (isWithinJsx) {
        return `\n${indentation}{/* ... */}\n`
      } else {
        return `\n${indentation}// ...\n`
      }
    default:
      return `\n${indentation}// ...\n`
  }
}

function isContainedInJsx(tree: acorn.Node, line: number) {
  const acornNodeContainsLine = (node: acorn.Node, line) =>
    node.loc?.start.line <= line && node.loc?.end.line >= line
  if (!acornNodeContainsLine(tree, line)) {
    return false
  }

  let candidateNarrowestContainingNode = tree

  function getNarrowestContainingNode(node: acorn.Node, line: number) {
    for (const key of Object.keys(node)) {
      const value = node[key]
      if (!value || typeof value !== 'object') {
        continue
      }

      if (!Array.isArray(value)) {
        if (acornNodeContainsLine(value, line)) {
          candidateNarrowestContainingNode = value
          getNarrowestContainingNode(value, line)
        }
      } else {
        for (const child of value) {
          if (!acornNodeContainsLine(child, line)) {
            continue
          } else {
            if (
              child.loc?.start?.line > candidateNarrowestContainingNode.loc?.start?.line ||
              child.loc.end.line < candidateNarrowestContainingNode.loc?.end?.line ||
              child.loc.start.column > candidateNarrowestContainingNode.loc?.start.column ||
              child.loc.end.column < candidateNarrowestContainingNode.loc?.end.column
            ) {
              candidateNarrowestContainingNode = child
              getNarrowestContainingNode(child, line)
            }
          }
        }
      }
    }
  }

  getNarrowestContainingNode(tree, line)
  return candidateNarrowestContainingNode.type.startsWith('JSX')
}

function createArrayAttributeValueExpression(...arrayElements: string[]) {
  const expression: MdxJsxAttributeValueExpression = {
    type: 'mdxJsxAttributeValueExpression',
    value: '[' + arrayElements.map((element) => `'${element}'`).join(', ') + ']',
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'ArrayExpression',
              elements: arrayElements.map((element) => ({
                type: 'Literal',
                value: element,
                raw: element,
              })),
            },
          },
        ],
      },
    },
  }
  return expression
}
