/**
 * The $CodeSample directive supports inclusion of code samples from a source
 * code file, which may be internal to this repo or external from another
 * GitHub repo.
 *
 * The syntax for internal references is:
 *
 * ```mdx
 * <$CodeSample path="path/to/file.ts" lines={[1, 2], [5, 7]} />
 * ```
 *
 * The syntax for external references is:
 *
 * ```mdx
 * <$CodeSample
 *   external
 *   org="supabase"
 *   repo="wrappers"
 *   commit="68d5s42hvs7p342kl65ldk90dsafdsa"
 *   path="path/to/file.ts"
 *   lines={[1, 2], [5, 7]}
 * />
 */

import { Root } from 'mdast'
import { MdxJsxAttributeValueExpression } from 'mdast-util-mdx'
import type {
  MdxJsxAttribute,
  MdxJsxExpressionAttribute,
  MdxJsxFlowElement,
  MdxJsxFlowElementHast,
  MdxJsxTextElement,
  MdxJsxTextElementHast,
} from 'mdast-util-mdx-jsx'
import Link from 'next/link'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { type PropsWithChildren } from 'react'
import { Parent } from 'unist'
import { visitParents } from 'unist-util-visit-parents'
import { z, type SafeParseError } from 'zod'

import { fetchWithNextOptions } from '~/features/helpers.fetch'
import { EXAMPLES_DIRECTORY } from '~/lib/docs'

export function CodeSampleWrapper({
  children,
  /**
   * A GitHub URL to the source code file.
   */
  source,
}: PropsWithChildren<{ source: string | URL }>) {
  return (
    <>
      {children}
      <Link href={source}>View source</Link>
    </>
  )
}

const linesSchema = z.array(z.tuple([z.coerce.number(), z.coerce.number()]))
const linesValidator = z.string().transform((v, ctx) => {
  try {
    const array = JSON.parse(v)
    return linesSchema.parse(array)
  } catch (e) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Not a JSONified array of line ranges' })
    return z.NEVER
  }
})

const codeSampleExternalSchema = z.object({
  external: z.coerce.boolean().refine((v) => v === true),
  org: z.string(),
  repo: z.string(),
  commit: z.string(),
  path: z.string().startsWith('/', { message: 'Path must start with a slash' }),
  lines: linesValidator,
})
type ICodeSampleExternal = z.infer<typeof codeSampleExternalSchema>

const codeSampleInternalSchema = z.object({
  external: z.coerce
    .boolean()
    .refine((v) => v === false)
    .optional(),
  path: z.string().startsWith('/', { message: 'Path must start with a slash' }),
  lines: linesValidator,
})
type ICodeSampleInternal = z.infer<typeof codeSampleInternalSchema>

function isExternalSource(
  meta: ICodeSampleExternal | ICodeSampleInternal
): meta is ICodeSampleExternal {
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
  const meta = [] as (ICodeSampleExternal | ICodeSampleInternal)[]
  const parentNodes = [] as Parent[]
  const pendingFetches = [] as Promise<string>[]

  visitParents(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, ancestors) => {
    if (node.name !== '$CodeSample') return

    const isExternal = getAttributeValueExpression(getAttributeValue(node, 'external')) === 'true'

    if (isExternal) {
      const org = getAttributeValue(node, 'org')
      const repo = getAttributeValue(node, 'repo')
      const commit = getAttributeValue(node, 'commit')
      const path = getAttributeValue(node, 'path')
      const lines = getAttributeValueExpression(getAttributeValue(node, 'lines'))

      const result = codeSampleExternalSchema.safeParse({
        external: isExternal,
        org,
        repo,
        commit,
        path,
        lines,
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
      meta.push(result.data)
      parentNodes.push(ancestors[ancestors.length - 1])
      pendingFetches.push(fetchTask)
    } else {
      const path = getAttributeValue(node, 'path')
      const lines = getAttributeValueExpression(getAttributeValue(node, 'lines'))

      const result = codeSampleInternalSchema.safeParse({
        external: isExternal,
        path,
        lines,
      })

      if (!result.success) {
        throw new Error(
          `Invalid $CodeSample directive: ${(result as SafeParseError<ICodeSampleInternal>).error.message}`
        )
      }

      const filePath = join(EXAMPLES_DIRECTORY, result.data.path)
      const fetchTask = readFile(filePath, 'utf-8')
      codeSampleNodes.push(node)
      meta.push(result.data)
      parentNodes.push(ancestors[ancestors.length - 1])
      pendingFetches.push(fetchTask)
    }
  })

  const resolvedContent = await Promise.all(pendingFetches)

  const nodeContentMap = new Map<
    MdxJsxFlowElement,
    [Parent, ICodeSampleExternal | ICodeSampleInternal, string]
  >()
  codeSampleNodes.forEach((node, index) => {
    nodeContentMap.set(node, [parentNodes[index], meta[index], resolvedContent[index]])
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

function rewriteNodes(
  contentMap: Map<MdxJsxFlowElement, [Parent, ICodeSampleExternal | ICodeSampleInternal, string]>
) {
  for (const [node, [parent, meta, content]] of contentMap) {
    const lang = matchLang(meta.path.split('.').pop())

    const source = isExternalSource(meta)
      ? `https://github.com/${meta.org}/${meta.repo}/blob/${meta.commit}${meta.path}`
      : `https://github.com/supabase/supabase/blob/${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}${meta.path}`

    const elidedContent = redactLines(content, meta.lines, lang)

    const replacementContent: MdxJsxFlowElement = {
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
          value: elidedContent,
        },
      ],
    }
    parent.children.splice(parent.children.indexOf(node), 1, replacementContent)
  }
}

function matchLang(lang: string) {
  switch (lang) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
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
      acc.push(createElidedLine(lang))
    }

    // Start and end are 1-indexed and inclusive
    acc.push(...contentLines.slice(start - 1, end === -1 ? contentLines.length : end))

    if (index === arr.length - 1 && end !== -1 && end !== contentLines.length) {
      acc.push(createElidedLine(lang))
    }

    return acc
  }, [] as string[])

  return preservedLines.join('\n').trim()
}

function createElidedLine(lang: string | null) {
  switch (lang) {
    case 'sql':
      return '\n-- [...]\n'
    default:
      return '\n// [...]\n'
  }
}
