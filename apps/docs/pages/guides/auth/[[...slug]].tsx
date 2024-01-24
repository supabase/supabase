import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, extname, sep } from 'node:path'

import components from '~/components'
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

  const { data: frontmatter, content } = matter(mdx)
  if (!isValidGuideFrontmatter(frontmatter)) {
    throw Error('Type of frontmatter is not valid')
  }
  const mdxSource = await serialize(content)

  return {
    props: {
      frontmatter,
      mdxSource,
    },
  }
}) satisfies GetStaticProps

export default function AuthGuide({
  frontmatter,
  mdxSource,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div>
      <h1>Auth Guide</h1>
      <MDXRemote {...mdxSource} components={components} />
    </div>
  )
}
