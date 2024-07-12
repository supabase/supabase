import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import { remarkCodeHike, type CodeHikeConfig } from '@code-hike/mdx'
import { ExternalLink } from 'lucide-react'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { type ComponentProps, type ReactNode } from 'react'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { cn } from 'ui'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import { components } from '~/features/docs/mdx.shared'
import type { WithRequired } from '~/features/helpers.types'
import { type GuideFrontmatter } from '~/lib/docs'
import { MDXProviderGuides } from './GuidesMdx.client'

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

const EDIT_LINK_SYMBOL = Symbol('edit link')
interface EditLink {
  [EDIT_LINK_SYMBOL]: true
  link: string
  includesProtocol: boolean
}

/**
 * Create an object representing a link where the original content can be
 * edited.
 *
 * Takes either a relative path, which will be prefixed with
 * `https://github.com/`, or a full URL including protocol.
 */
const newEditLink = (str: string): EditLink => {
  if (str.startsWith('/')) {
    throw Error(`Edit links cannot start with slashes. Received: ${str}`)
  }

  /**
   * Catch strings that provide FQDNS without https?:
   *
   * At the start of a string, before the first slash, there is a dot
   * surrounded by non-slash characters.
   */
  if (/^[^\/]+\.[^\/]+\//.test(str)) {
    throw Error(`Fully qualified domain names must start with 'https?'. Received: ${str}`)
  }

  return {
    [EDIT_LINK_SYMBOL]: true,
    link: str,
    includesProtocol: str.startsWith('http://') || str.startsWith('https://'),
  }
}

interface BaseGuideTemplateProps {
  meta?: GuideFrontmatter
  content?: string
  children?: ReactNode
  editLink: EditLink
  mdxOptions?: SerializeOptions
}

type GuideTemplateProps =
  | WithRequired<BaseGuideTemplateProps, 'children'>
  | WithRequired<BaseGuideTemplateProps, 'content'>

const GuideTemplate = ({ meta, content, children, editLink, mdxOptions }: GuideTemplateProps) => {
  const hideToc = meta?.hideToc || meta?.hide_table_of_contents

  return (
    <div className={'grid grid-cols-12 relative gap-4'}>
      <div
        className={cn(
          'relative',
          'transition-all ease-out',
          'duration-100',
          hideToc ? 'col-span-12' : 'col-span-12 md:col-span-9'
        )}
      >
        <article
          // Used to get headings for the table of contents
          id="sb-docs-guide-main-article"
          className="prose max-w-none"
        >
          <h1 className="mb-0">{meta?.title || 'Supabase Docs'}</h1>
          {meta?.subtitle && (
            <h2 className="mt-3 text-xl text-foreground-light">{meta.subtitle}</h2>
          )}
          <hr className="not-prose border-t-0 border-b my-8" />
          <MDXProviderGuides>
            {content && <MDXRemoteGuides source={content} options={mdxOptions} />}
          </MDXProviderGuides>
          {children}
          <footer className="mt-16 not-prose">
            <a
              href={
                editLink.includesProtocol ? editLink.link : `https://github.com/${editLink.link}`
              }
              className={cn(
                'w-fit',
                'flex items-center gap-1',
                'text-sm text-scale-1000 hover:text-scale-1200',
                'transition-colors'
              )}
              target="_blank"
              rel="noreferrer noopener"
            >
              Edit this page on GitHub <ExternalLink size={14} strokeWidth={1.5} />
            </a>
          </footer>
        </article>
      </div>
      {!hideToc && (
        <GuidesTableOfContents
          video={meta?.tocVideo}
          className={cn(
            'hidden md:block',
            'col-span-3 self-start',
            'sticky',
            /**
             * --header-height: height of nav
             * 1px: height of nav border
             * 4rem: content padding
             */
            'top-[calc(var(--header-height)+1px+4rem)]',
            // 5rem accounts for 4rem of top padding + 1rem of extra breathing room
            'max-h-[calc(100vh-var(--header-height)-5rem)]'
          )}
        />
      )}
    </div>
  )
}

export { GuideTemplate, MDXRemoteGuides, newEditLink }
