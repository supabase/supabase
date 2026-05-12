import { type Root } from 'mdast'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'

import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'
import { getGitHubFileContentsImmutableOnly } from '~/lib/octokit'
import { codeSampleRemark } from './CodeSample'
import { codeTabsRemark } from './CodeTabs'
import { fromDocsMarkdown } from './utils.server'
import { partialsRemark } from './Partial'
import { showRemark } from './Show'

type Transformer = (ast: Root) => Root | Promise<Root>

export async function preprocessMdx<T>(mdx: string, transformers: Transformer[]) {
  if (!mdx) return mdx

  let mdast = fromDocsMarkdown(mdx)
  for (const transform of transformers) {
    mdast = await transform(mdast)
  }

  const output = toMarkdown(mdast, { extensions: [mdxToMarkdown(), gfmToMarkdown()] })
  return output
}

export function preprocessMdxWithDefaults(mdx: string) {
  return preprocessMdx(mdx, [
    showRemark(),
    remarkMkDocsAdmonition(),
    remarkPyMdownTabs(),
    partialsRemark(),
    codeSampleRemark({
      fetchFromGitHub: getGitHubFileContentsImmutableOnly,
    }),
    codeTabsRemark(),
  ])
}
