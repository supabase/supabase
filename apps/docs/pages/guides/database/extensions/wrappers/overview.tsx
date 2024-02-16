import { remarkCodeHike, type CodeHikeConfig } from '@code-hike/mdx'
import matter from 'gray-matter'
import { type GetStaticProps, type InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { serialize } from 'next-mdx-remote/serialize'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import remarkGfm from 'remark-gfm'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

import components from '~/components'
import Layout from '~/layouts/DefaultGuideLayout'
import { GUIDES_DIRECTORY, isValidGuideFrontmatter } from '~/lib/docs'

export const getStaticProps = (async () => {
  const fullPath = join(GUIDES_DIRECTORY, 'database/extensions/wrappers', 'overview.mdx')
  const mdx = await readFile(fullPath, 'utf-8')

  const editLink = `supabase/supabase/blob/master/apps/docs/content/guides/database/extensions/wrappers/overview.mdx`

  const { data: frontmatter, content } = matter(mdx)
  if (!isValidGuideFrontmatter(frontmatter)) {
    throw Error('Type of frontmatter is not valid')
  }

  const codeHikeOptions: CodeHikeConfig = {
    theme: codeHikeTheme,
    lineNumbers: true,
    showCopyButton: true,
    skipLanguages: [],
    autoImport: false,
  }

  const mdxOptions: SerializeOptions = {
    mdxOptions: {
      useDynamicImport: true,
      remarkPlugins: [remarkGfm, [remarkCodeHike, codeHikeOptions]],
    },
  }
  const mdxSource = await serialize(content, mdxOptions)

  return {
    props: {
      frontmatter,
      mdxSource,
      editLink,
    },
  }
}) satisfies GetStaticProps

export default function DatabaseGuide({
  frontmatter,
  mdxSource,
  editLink,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { hideToc, ...meta } = frontmatter

  return (
    <Layout meta={meta} hideToc={hideToc} editLink={editLink}>
      <MDXRemote {...mdxSource} components={components} />
    </Layout>
  )
}
