import { type CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import matter from 'gray-matter'
import { type Metadata, type ResolvingMetadata } from 'next'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { extname, join, sep } from 'node:path'
import { type ComponentProps } from 'react'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { BASE_PATH, MISC_URL } from '~/lib/constants'
import { GUIDES_DIRECTORY, isValidGuideFrontmatter, type GuideFrontmatter } from '~/lib/docs'
import { components } from './GuidesMdx.shared'

const PUBLISHED_SECTIONS = [
  'ai',
  'api',
  'auth',
  'cli',
  'database',
  'functions',
  'getting-started',
  // 'graphql', -- technically published, but completely federated
  'platform',
  'realtime',
  'resources',
  'self-hosting',
  'storage',
] as const

const getGuidesMarkdown = async ({ slug }: { slug: string[] }) => {
  const relPath = slug.join(sep).replace(/\/$/, '')
  const fullPath = join(GUIDES_DIRECTORY, relPath + '.mdx')
  /**
   * SAFETY CHECK:
   * Prevent accessing anything outside of published sections and GUIDES_DIRECTORY
   */
  if (
    !fullPath.startsWith(GUIDES_DIRECTORY) ||
    !PUBLISHED_SECTIONS.some((section) => relPath.startsWith(section))
  ) {
    throw Error('Accessing forbidden route. Content must be within the GUIDES_DIRECTORY.')
  }

  const mdx = await readFile(fullPath, 'utf-8')

  const editLink = `supabase/supabase/blob/master/apps/docs/content/guides/${relPath}.mdx`

  const { data: meta, content } = matter(mdx)
  if (!isValidGuideFrontmatter(meta)) {
    throw Error('Type of frontmatter is not valid')
  }

  return {
    pathname: `/guides/${slug.join('/')}`,
    meta,
    content,
    editLink,
  }
}

const genGuidesStaticParams = (directory?: string) => async () => {
  const promises = directory
    ? (await readdir(join(GUIDES_DIRECTORY, directory), { recursive: true }))
        .filter((file) => extname(file) === '.mdx')
        .map((file) => ({ slug: file.replace(/\.mdx$/, '').split(sep) }))
    : PUBLISHED_SECTIONS.map(async (section) =>
        (await readdir(join(GUIDES_DIRECTORY, section), { recursive: true }))
          .filter((file) => extname(file) === '.mdx')
          .map((file) => ({
            slug: [section, ...file.replace(/\.mdx$/, '').split(sep)],
          }))
          .concat(existsSync(join(GUIDES_DIRECTORY, `${section}.mdx`)) ? [{ slug: [section] }] : [])
      )

  /**
   * Flattening earlier will not work because there is nothing to flatten
   * until the promises resolve.
   */
  const result = (await Promise.all(promises)).flat()
  return result
}

type OrPromise<T> = T | Promise<T>

const genGuideMeta =
  <Params,>(
    generate: (params: Params) => OrPromise<{ meta: GuideFrontmatter; pathname: string }>
  ) =>
  async ({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> => {
    const parentAlternates = (await parent).alternates
    const parentOg = (await parent).openGraph

    const { meta, pathname } = await generate(params)

    // Pathname has form `/guides/(section)/**`
    const ogType = pathname.split('/')[2]

    return {
      title: `${meta.title} | Supabase Docs`,
      description: meta.description || meta.subtitle,
      // @ts-ignore
      alternates: {
        ...parentAlternates,
        canonical: meta.canonical || `${BASE_PATH}${pathname}`,
      },
      openGraph: {
        ...parentOg,
        url: `${BASE_PATH}${pathname}`,
        images: {
          url: `${MISC_URL}/functions/v1/og-images?site=docs&type=${encodeURIComponent(ogType)}&title=${encodeURIComponent(meta.title)}&description=${encodeURIComponent(meta.description ?? 'undefined')}`,
          width: 800,
          height: 600,
          alt: meta.title,
        },
      },
    }
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

const MDXRemoteGuides = ({ options = {}, ...props }: ComponentProps<typeof MDXRemote>) => {
  const { mdxOptions: { remarkPlugins, rehypePlugins, ...otherMdxOptions } = {}, ...otherOptions } =
    options
  const {
    mdxOptions: {
      remarkPlugins: originalRemarkPlugins,
      rehypePlugins: originalRehypePlugins,
      ...originalMdxOptions
    } = {},
  } = mdxOptions

  const finalOptions = {
    ...mdxOptions,
    ...otherOptions,
    mdxOptions: {
      ...originalMdxOptions,
      ...otherMdxOptions,
      remarkPlugins: [...(originalRemarkPlugins ?? []), ...(remarkPlugins ?? [])],
      rehypePlugins: [...(originalRehypePlugins ?? []), ...(rehypePlugins ?? [])],
    },
  } as SerializeOptions

  return <MDXRemote components={components} options={finalOptions} {...props} />
}

export { MDXRemoteGuides, getGuidesMarkdown, genGuidesStaticParams, genGuideMeta }
