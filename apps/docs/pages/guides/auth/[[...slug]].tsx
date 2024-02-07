import { type CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import type { SerializeOptions } from 'next-mdx-remote/dist/types'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, extname, sep } from 'node:path'
import remarkGfm from 'remark-gfm'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

import components from '~/components'
import Layout from '~/layouts/DefaultGuideLayout'
import { GUIDES_DIRECTORY, isValidGuideFrontmatter } from '~/lib/docs'

export const getStaticPaths = (async () => {
  const directory = join(GUIDES_DIRECTORY, 'auth')
  const files = (await readdir(directory, { recursive: true }))
    .filter((file) => extname(file) === '.mdx')
    .map((file) => ({
      params: {
        slug: file.replace(/\.mdx$/, '').split(sep),
      },
    }))

  // Index page isn't included in the directory
  const indexFile = join(GUIDES_DIRECTORY, 'auth.mdx')
  if (existsSync(indexFile)) {
    files.push({ params: { slug: [] } })
  }

  return {
    paths: files,
    fallback: false,
  }
}) satisfies GetStaticPaths

export const getStaticProps = (async ({ params }) => {
  let relPath: string
  switch (typeof params.slug) {
    case 'string':
      relPath = 'auth' + sep + params.slug
      break
    case 'object': // actually an array
      relPath = 'auth' + sep + params.slug.join(sep)
      break
    case 'undefined':
      relPath = 'auth'
  }

  const fullPath = join(GUIDES_DIRECTORY, relPath + '.mdx')
  const mdx = await readFile(fullPath, 'utf-8')

  const editLink = `supabase/supabase/blob/master/apps/docs/content/guides/${relPath}.mdx`

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

export default function AuthGuide({
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
