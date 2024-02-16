import { type CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import type { SerializeOptions } from 'next-mdx-remote/dist/types'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import remarkGfm from 'remark-gfm'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

const DOCS_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..')
export const GUIDES_DIRECTORY = join(DOCS_DIRECTORY, 'content/guides')

type GuideFrontmatter = {
  title: string
  description?: string
  hideToc?: boolean
}

export function isValidGuideFrontmatter(obj: object): obj is GuideFrontmatter {
  if (!('title' in obj) || typeof obj.title !== 'string') return false
  if ('description' in obj && typeof obj.description !== 'string') return false
  return true
}

export async function getGuidesStaticPaths(section: string) {
  const directory = join(GUIDES_DIRECTORY, section)

  const files = (await readdir(directory, { recursive: true }))
    .filter((file) => extname(file) === '.mdx')
    .map((file) => ({
      params: {
        slug: file.replace(/\.mdx$/, '').split(sep),
      },
    }))

  // Index page isn't included in the directory
  const indexFile = join(GUIDES_DIRECTORY, `${section}.mdx`)
  if (existsSync(indexFile)) {
    files.push({ params: { slug: [] } })
  }

  return {
    paths: files,
    fallback: false,
  }
}

export async function getGuidesStaticProps(
  section: string,
  { params }: { params?: { slug?: string | Array<string> } }
) {
  let relPath: string
  switch (typeof params?.slug) {
    case 'string':
      relPath = section + sep + params.slug
      break
    case 'object': // actually an array
      relPath = section + sep + params.slug.join(sep)
      break
    case 'undefined':
      relPath = section
  }

  const fullPath = join(GUIDES_DIRECTORY, relPath + '.mdx')
  /**
   * SAFETY CHECK:
   * Prevent accessing anything outside of GUIDES_DIRECTORY
   */
  if (!fullPath.startsWith(GUIDES_DIRECTORY)) {
    throw Error('Accessing forbidden route. Content must be within the GUIDES_DIRECTORY.')
  }

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
}
