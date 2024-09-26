import matter from 'gray-matter'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import CliGlobalFlagsHandler from '~/components/reference/enrichments/cli/CliGlobalFlagsHandler'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { components } from '~/features/docs/MdxBase.shared'
import { RefSubLayout } from '~/features/docs/Reference.ui'
import { cache_fullProcess_withDevCacheBust } from '~/features/helpers.fs'
import { REF_DOCS_DIRECTORY } from '~/lib/docs'

async function getRefMarkdownInternal(relPath: string) {
  const fullPath = join(REF_DOCS_DIRECTORY, relPath + '.mdx')

  try {
    if (!fullPath.startsWith(REF_DOCS_DIRECTORY)) {
      throw Error(`Accessing forbidden path outside of REF_DOCS_DIRECTORY: ${fullPath}`)
    }

    const mdx = await readFile(fullPath, 'utf-8')
    const { content } = matter(mdx)
    return content
  } catch (err) {
    console.error(`Error fetching reference markdown from file: ${fullPath}:\n\n${err}`)
    return ''
  }
}

/**
 * Caching this for the entire process is fine because the Markdown content is
 * baked into each deployment and cannot change. There's also nothing sensitive
 * here: this is just reading the public MDX files from the codebase.
 */
const getRefMarkdown = cache_fullProcess_withDevCacheBust(
  getRefMarkdownInternal,
  REF_DOCS_DIRECTORY,
  (filename: string) => JSON.stringify([filename.replace(/\.mdx$/, '')])
)

interface MDXRemoteRefsProps {
  source: string
}

function MDXRemoteRefs({ source }: MDXRemoteRefsProps) {
  const refComponents = { ...components, RefSubLayout, CliGlobalFlagsHandler }

  return <MDXRemoteBase source={source} components={refComponents} customPreprocess={(x) => x} />
}

export { getRefMarkdown, MDXRemoteRefs }
