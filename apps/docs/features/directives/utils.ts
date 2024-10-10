import { type Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'

import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'
import { getGitHubFileContents } from '~/lib/octokit'
import { getGitHubFileContentsImmutableOnly } from '~/lib/octokit'
import { codeSampleRemark } from './CodeSample'

type Transformer = (ast: Root) => Root | Promise<Root>

export async function preprocessMdx<T>(mdx: string, transformers: Transformer[]) {
  let mdast = fromMarkdown(mdx, {
    mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
    extensions: [mdxjs(), gfm()],
  })

  for (const transform of transformers) {
    mdast = await transform(mdast)
  }

  const output = toMarkdown(mdast, { extensions: [mdxToMarkdown(), gfmToMarkdown()] })
  return output
}

export function preprocessMdxWithDefaults(mdx: string) {
  return preprocessMdx(mdx, [
    remarkMkDocsAdmonition(),
    remarkPyMdownTabs(),
    codeSampleRemark({
      fetchFromGitHub: getGitHubFileContentsImmutableOnly,
    }),
  ])
}
