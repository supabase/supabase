import { type CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import type { SerializeOptions } from 'next-mdx-remote/dist/types'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, extname, sep, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

const DOCS_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..')
export const GUIDES_DIRECTORY = join(DOCS_DIRECTORY, 'content/guides')
export const REF_DOCS_DIRECTORY = join(DOCS_DIRECTORY, 'docs/ref')
export const SPEC_DIRECTORY = join(DOCS_DIRECTORY, 'spec')

export type GuideFrontmatter = {
  title: string
  subtitle?: string
  description?: string
  canonical?: string
  hideToc?: boolean
  // @deprecated
  hide_table_of_contents?: boolean
  tocVideo?: string
}

/**
 * Validate the frontmatter for guide MDX files.
 *
 * @throws Throws if frontmatter is invalid.
 */
export function isValidGuideFrontmatter(obj: object): obj is GuideFrontmatter {
  if (!('title' in obj) || typeof obj.title !== 'string') {
    throw Error(
      // @ts-expect-error - Getting undefined for unknown property is desired here.
      `Invalid guide frontmatter: Title must exist and be a string. Received: ${obj.title}`
    )
  }
  if ('subtitle' in obj && typeof obj.subtitle !== 'string') {
    throw Error(`Invalid guide frontmatter: Subtitle must be a sring. Received: ${obj.subtitle}`)
  }
  if ('description' in obj && typeof obj.description !== 'string') {
    throw Error(
      `Invalid guide frontmatter: Description must be a string. Received: ${obj.description}`
    )
  }
  if ('canonical' in obj && typeof obj.canonical !== 'string') {
    throw Error(`Invalid guide frontmatter: Canonical must be a string. Received: ${obj.canonical}`)
  }
  if ('hideToc' in obj && typeof obj.hideToc !== 'boolean') {
    throw Error(`Invalid guide frontmatter: hideToc must be a boolean. Received: ${obj.hideToc}`)
  }
  if ('hide_table_of_contents' in obj && typeof obj.hide_table_of_contents !== 'boolean') {
    throw Error(
      `Invalid guide frontmatter: hide_table_of_contents must be a boolean. Received ${obj.hide_table_of_contents}`
    )
  }
  if ('tocVideo' in obj && typeof obj.tocVideo !== 'string') {
    throw Error(`Invalid guide frontmatter: tocVideo must be a string. Received ${obj.tocVideo}`)
  }
  return true
}

export async function getGuidesStaticPaths(section: string) {
  const directory = join(GUIDES_DIRECTORY, section)

  const files = (await readdir(directory, { recursive: true }))
    .filter((file) => extname(file) === '.mdx' && !basename(file).startsWith('_'))
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
    // Will have thrown
    return
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
      remarkPlugins: [
        [remarkMath, { singleDollarTextMath: false }],
        remarkGfm,
        [remarkCodeHike, codeHikeOptions],
      ],
      rehypePlugins: [rehypeKatex as any],
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
