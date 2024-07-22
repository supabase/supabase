import matter from 'gray-matter'
import { type Metadata, type ResolvingMetadata } from 'next'
import { redirect } from 'next/navigation'
import { readFile, readdir } from 'node:fs/promises'
import { extname, join, sep } from 'node:path'

import { pluckPromise } from '~/features/helpers.fn'
import { cache_fullProcess_withDevCacheBust, existsFile } from '~/features/helpers.fs'
import type { OrPromise } from '~/features/helpers.types'
import { notFoundLink } from '~/features/recommendations/NotFound.utils'
import { generateOpenGraphImageMeta } from '~/features/seo/openGraph'
import { BASE_PATH, MISC_URL } from '~/lib/constants'
import { GUIDES_DIRECTORY, isValidGuideFrontmatter, type GuideFrontmatter } from '~/lib/docs'
import { newEditLink } from './GuidesMdx.template'

/**
 * [TODO Charis]
 *
 * This is kind of a dumb place for this to be, clean up later as part of
 * cleaning up navigation menus.
 */
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

const getGuidesMarkdownInternal = async ({ slug }: { slug: string[] }) => {
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
    redirect(notFoundLink(slug.join('/')))
  }

  let mdx: string
  try {
    mdx = await readFile(fullPath, 'utf-8')
  } catch {
    redirect(notFoundLink(slug.join('/')))
  }

  const editLink = newEditLink(
    `supabase/supabase/blob/master/apps/docs/content/guides/${relPath}.mdx`
  )

  const { data: meta, content } = matter(mdx)
  if (!isValidGuideFrontmatter(meta)) {
    throw Error('Type of frontmatter is not valid')
  }

  return {
    pathname: `/guides/${slug.join('/')}` satisfies `/${string}`,
    meta,
    content,
    editLink,
  }
}

/**
 * Caching this for the entire process is fine because the Markdown content is
 * baked into each deployment and cannot change. There's also nothing sensitive
 * here: this is just reading the public MDX files from the codebase.
 */
const getGuidesMarkdown = cache_fullProcess_withDevCacheBust(
  getGuidesMarkdownInternal,
  GUIDES_DIRECTORY,
  (filename: string) => JSON.stringify([{ slug: filename.replace(/\.mdx$/, '').split(sep) }])
)

const genGuidesStaticParams = (directory?: string) => async () => {
  const promises = directory
    ? (await readdir(join(GUIDES_DIRECTORY, directory), { recursive: true }))
        .filter((file) => extname(file) === '.mdx' && !file.split(sep).at(-1).startsWith('_'))
        .map((file) => ({ slug: file.replace(/\.mdx$/, '').split(sep) }))
    : PUBLISHED_SECTIONS.map(async (section) =>
        (await readdir(join(GUIDES_DIRECTORY, section), { recursive: true }))
          .filter((file) => extname(file) === '.mdx' && !file.split(sep).at(-1).startsWith('_'))
          .map((file) => ({
            slug: [section, ...file.replace(/\.mdx$/, '').split(sep)],
          }))
          .concat(
            (await existsFile(join(GUIDES_DIRECTORY, `${section}.mdx`)))
              ? [{ slug: [section] }]
              : []
          )
      )

  /**
   * Flattening earlier will not work because there is nothing to flatten
   * until the promises resolve.
   */
  const result = (await Promise.all(promises)).flat()
  return result
}

const genGuideMeta =
  <Params,>(
    generate: (params: Params) => OrPromise<{ meta: GuideFrontmatter; pathname: `/${string}` }>
  ) =>
  async ({ params }: { params: Params }, parent: ResolvingMetadata): Promise<Metadata> => {
    const [parentAlternates, parentOg, { meta, pathname }] = await Promise.all([
      pluckPromise(parent, 'alternates'),
      pluckPromise(parent, 'openGraph'),
      generate(params),
    ])

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
        images: generateOpenGraphImageMeta({
          type: ogType,
          title: meta.title,
          description: meta.description,
        }),
      },
    }
  }

export { getGuidesMarkdown, genGuidesStaticParams, genGuideMeta }
