import { type Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxjs } from 'micromark-extension-mdxjs'

import { getGitHubFileContents } from '~/lib/octokit'
import { codeSampleRemark } from './CodeSample'

type Transformer = (ast: Root) => Root | Promise<Root>

export async function preprocessMdx<T>(mdx: string, transformers: Transformer[]) {
  let mdast = fromMarkdown(mdx, {
    mdastExtensions: [mdxFromMarkdown()],
    extensions: [mdxjs()],
  })

  for (const transform of transformers) {
    mdast = await transform(mdast)
  }

  const output = toMarkdown(mdast, { extensions: [mdxToMarkdown()] })
  return output
}

export function preprocessMdxWithDefaults(mdx: string) {
  return preprocessMdx(mdx, [codeSampleRemark({ fetchFromGitHub: getGitHubFileContents })])
}
