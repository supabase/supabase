import * as Sentry from '@sentry/nextjs'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { type Metadata, type ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { readdir } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'

import { extractMessageFromAnyError, FileNotFoundError } from '~/app/api/utils'
import { pluckPromise } from '~/features/helpers.fn'
import { cache_fullProcess_withDevCacheBust, existsFile } from '~/features/helpers.fs'
import type { OrPromise } from '~/features/helpers.types'
import { generateOpenGraphImageMeta } from '~/features/seo/openGraph'
import { BASE_PATH } from '~/lib/constants'
import { GUIDES_DIRECTORY, isValidGuideFrontmatter, type GuideFrontmatter } from '~/lib/docs'
import { GuideModelLoader } from '~/resources/guide/guideModelLoader'
import { newEditLink } from './GuidesMdx.template'
import { checkGuidePageEnabled } from './NavigationPageStatus.utils'

const PUBLISHED_SECTIONS = [
  'ai',
  'api',
  'auth',
  'cron',
  'database',
  'deployment',
  'functions',
  'getting-started',
  // 'graphql', -- technically published, but completely federated
  'integrations',
  'local-development',
  'platform',
  'queues',
  'realtime',
  'resources',
  'security',
  'self-hosting',
  'storage',
  'telemetry',
] as const

const getGuidesMarkdownInternal = async (slug: string[]) => {
  const relPath = slug.join(sep).replace(/\/$/, '')
  const fullPath = join(GUIDES_DIRECTORY, relPath + '.mdx')
  const guidesPath = `/guides/${slug.join('/')}`

  /**
   * SAFETY CHECK:
   * Prevent accessing anything outside of published sections and GUIDES_DIRECTORY
   */
  if (
    !fullPath.startsWith(GUIDES_DIRECTORY) ||
    !PUBLISHED_SECTIONS.some((section) => relPath.startsWith(section))
  ) {
    notFound()
  }

  /**
   * DISABLED PAGE CHECK:
   * Check if this page is disabled in the navigation configuration
   */
  if (!checkGuidePageEnabled(guidesPath)) {
    console.log('Page is disabled: %s', guidesPath)
    notFound()
  }

  try {
    const guide = (await GuideModelLoader.fromFs(relative(GUIDES_DIRECTORY, fullPath))).unwrap()
    const content = guide.content ?? ''
    const meta = guide.metadata ?? {}

    if (!isValidGuideFrontmatter(meta)) {
      throw Error(`Type of frontmatter is not valid for path: ${fullPath}`)
    }

    const editLink = newEditLink(
      `supabase/supabase/blob/master/apps/docs/content/guides/${relPath}.mdx`
    )

    return {
      pathname: `/guides/${slug.join('/')}` satisfies `/${string}`,
      meta,
      content,
      editLink,
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.cause instanceof FileNotFoundError) {
      // Not using console.error because this includes pages that are genuine
      // 404s and clutters up the logs
      console.log('Could not read Markdown at path: %s', fullPath)
    } else {
      console.error(
        'Error processing Markdown file at path: %s:\n\t%s',
        fullPath,
        extractMessageFromAnyError(error)
      )
      Sentry.captureException(error)
    }
    notFound()
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
  (filename: string) => JSON.stringify([filename.replace(/\.mdx$/, '').split(sep)])
)

const genGuidesStaticParams = (directory?: string) => async () => {
  const promises = directory
    ? (await readdir(join(GUIDES_DIRECTORY, directory), { recursive: true }))
        .filter((file) => extname(file) === '.mdx' && !file.split(sep).at(-1)?.startsWith('_'))
        .map((file) => ({ slug: file.replace(/\.mdx$/, '').split(sep) }))
        .concat(
          (await existsFile(join(GUIDES_DIRECTORY, `${directory}.mdx`))) ? [{ slug: [] }] : []
        )
    : PUBLISHED_SECTIONS.map(async (section) =>
        (await readdir(join(GUIDES_DIRECTORY, section), { recursive: true }))
          .filter((file) => extname(file) === '.mdx' && !file.split(sep).at(-1)?.startsWith('_'))
          .map((file) => ({
            slug: [section, ...file.replace(/\.mdx$/, '').split(sep)],
          }))
          .concat(
            (await existsFile(join(GUIDES_DIRECTORY, `${section}.mdx`)))
              ? [{ slug: [section] }]
              : []
          )
      )

  // Flattening earlier will not work because there is nothing to flatten
  // until the promises resolve.
  const allParams = (await Promise.all(promises)).flat()

  /**
   * Filter out disabled pages from static generation
   */
  const enabledParams = allParams.filter((param) => {
    const guidesPath = `/guides/${directory ? `${directory}/` : ''}${param.slug.join('/')}`
    const isEnabled = checkGuidePageEnabled(guidesPath)

    if (!isEnabled) {
      console.log('Excluding disabled page from static generation: %s', guidesPath)
    }

    return isEnabled
  })

  return enabledParams
}

const genGuideMeta =
  <Params,>(
    generate: (params: Params) => OrPromise<{ meta: GuideFrontmatter; pathname: `/${string}` }>
  ) =>
  async (props: { params: Promise<Params> }, parent: ResolvingMetadata): Promise<Metadata> => {
    const params = await props.params
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

function removeRedundantH1(content: string) {
  const mdxTree = fromMarkdown(content, 'utf-8', {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })

  const maybeH1 = mdxTree.children[0]
  if (maybeH1 && maybeH1.type === 'heading' && maybeH1.depth === 1) {
    content = content.slice(maybeH1.position?.end?.offset)
  }

  return content
}

export { genGuideMeta, genGuidesStaticParams, getGuidesMarkdown, removeRedundantH1 }
