import { ExternalLink } from 'lucide-react'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'

import { Button, cn } from 'ui'

import Breadcrumbs from '~/components/Breadcrumbs'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import { TocAnchorsProvider } from '~/features/docs/GuidesMdx.client'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import type { WithRequired } from '~/features/helpers.types'
import { type GuideFrontmatter } from '~/lib/docs'
import Link from 'next/link'
import Image from 'next/image'
import logo from '~/public/img/showcase-logo/supabase-logo.svg'

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
    <TocAnchorsProvider>
      <div className={'grid grid-cols-12 relative gap-4'}>
        <div
          className={cn(
            'relative',
            'transition-all ease-out',
            'duration-100',
            hideToc ? 'col-span-12' : 'col-span-12 md:col-span-9'
          )}
        >
          <Breadcrumbs className="mb-2" />
          <article
            // Used to get headings for the table of contents
            id="sb-docs-guide-main-article"
            className="prose max-w-none"
          >
            <div className="flex items-end justify-between">
              <div>
                <h1 className="mb-0 [&>p]:m-0">
                  <ReactMarkdown>{meta?.title || 'Supabase Docs'}</ReactMarkdown>
                </h1>
                {meta?.subtitle && (
                  <h2 className="mt-3 text-xl text-foreground-light">
                    <ReactMarkdown>{meta.subtitle}</ReactMarkdown>
                  </h2>
                )}
              </div>
              {meta?.recipe && (
                <Button
                  type="outline"
                  size="small"
                  className="no-underline items-center [&_.truncate]:inline-flex [&_.truncate]:items-center &_.truncate]:gap-4 bg-surface-100"
                  asChild
                >
                  <Link
                    href={`http://localhost:8082/project/_/recipe/${meta.recipe}`}
                    target="_blank"
                  >
                    <svg
                      width="19"
                      height="20"
                      viewBox="0 0 19 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2"
                    >
                      <g clip-path="url(#clip0_2794_646)">
                        <path
                          d="M11.1049 19.5194C10.6065 20.1567 9.59583 19.8075 9.58382 18.9937L9.4082 7.09082H17.2905C18.7182 7.09082 19.5145 8.76517 18.6267 9.9005L11.1049 19.5194Z"
                          fill="url(#paint0_linear_2794_646)"
                        />
                        <path
                          d="M11.1049 19.5194C10.6065 20.1567 9.59583 19.8075 9.58382 18.9937L9.4082 7.09082H17.2905C18.7182 7.09082 19.5145 8.76517 18.6267 9.9005L11.1049 19.5194Z"
                          fill="url(#paint1_linear_2794_646)"
                          fill-opacity="0.2"
                        />
                        <path
                          d="M7.89915 0.36653C8.39759 -0.270886 9.40825 0.0783723 9.42026 0.892189L9.49722 12.7951H1.71354C0.28579 12.7951 -0.51049 11.1207 0.377325 9.98537L7.89915 0.36653Z"
                          fill="#3ECF8E"
                        />
                      </g>
                      <defs>
                        <linearGradient
                          id="paint0_linear_2794_646"
                          x1="9.4082"
                          y1="9.72999"
                          x2="16.4454"
                          y2="12.6367"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stop-color="#249361" />
                          <stop offset="1" stop-color="#3ECF8E" />
                        </linearGradient>
                        <linearGradient
                          id="paint1_linear_2794_646"
                          x1="6.30231"
                          y1="5.41211"
                          x2="9.57387"
                          y2="11.4774"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop />
                          <stop offset="1" stop-opacity="0" />
                        </linearGradient>
                        <clipPath id="clip0_2794_646">
                          <rect width="19" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    Add to project
                  </Link>
                </Button>
              )}
            </div>
            <hr className="not-prose border-t-0 border-b my-8" />

            {content && <MDXRemoteBase source={content} options={mdxOptions} />}
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
              'hidden md:flex',
              'col-span-3 self-start',
              'sticky',
              /**
               * --header-height: height of nav
               * 1px: height of nav border
               * 2rem: content padding
               */
              'top-[calc(var(--header-height)+1px+2rem)]',
              // 3rem accounts for 2rem of top padding + 1rem of extra breathing room
              'max-h-[calc(100vh-var(--header-height)-3rem)]'
            )}
          />
        )}
      </div>
    </TocAnchorsProvider>
  )
}

export { GuideTemplate, newEditLink }
