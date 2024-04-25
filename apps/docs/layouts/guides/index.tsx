import { MDXProvider } from '@mdx-js/react'
import 'katex/dist/katex.min.css'
import { ExternalLink } from 'lucide-react'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { type FC } from 'react'

import { cn } from 'ui'

import components from '~/components'
import { FooterHelpCalloutType } from '~/components/FooterHelpCallout'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import { type MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { MainSkeleton } from '~/layouts/MainSkeleton'

interface Props {
  meta: {
    title: string
    description?: string // used in meta tags
    hide_table_of_contents?: boolean
    breadcrumb?: string
    subtitle?: string // used on the page under the H1
    footerHelpType?: FooterHelpCalloutType
    video?: string
    tocVideo?: string
    canonical?: string
  }
  editLink?: string
  children: any
  toc?: any
  currentPage?: string
  hideToc?: boolean
  menuId: MenuId
}

const Layout: FC<Props> = (props) => {
  const { asPath } = useRouter()
  const router = useRouter()

  const menuId = props.menuId

  const EDIT_BUTTON_EXCLUDE_LIST = ['/404']

  // page type, ie, Auth, Database, Storage etc
  const ogPageType = asPath.split('/')[2]
  // open graph image url constructor
  const ogImageUrl = encodeURI(
    `https://obuldanrptloktxcffvn.supabase.co/functions/v1/og-images?site=docs${
      ogPageType ? `&type=${ogPageType}` : ''
    }&title=${props.meta?.title}&description=${props.meta?.description}`
  )

  return (
    <>
      <NextSeo
        title={`${props.meta?.title} | Supabase Docs`}
        canonical={props.meta?.canonical ?? `https://supabase.com/docs${asPath}`}
        openGraph={{
          url: `https://supabase.com/docs${asPath}`,
          type: 'article',
          siteName: 'Supabase',
          title: `${props.meta?.title} | Supabase Docs`,
          description: props.meta?.description,
          images: [
            {
              url: ogImageUrl,
              width: 800,
              height: 600,
              alt: props.meta?.title,
            },
          ],
          videos: props.meta?.video && [
            {
              // youtube based video meta
              url: props.meta?.video,
              width: 640,
              height: 385,
              type: 'application/x-shockwave-flash',
            },
          ],
          article: {
            publishedTime: new Date().toISOString(),
            modifiedTime: new Date().toISOString(),
            authors: ['Supabase'],
          },
        }}
        twitter={{
          cardType: 'summary_large_image',
          site: '@supabase',
          handle: '@supabase',
        }}
      />
      <MainSkeleton menuId={menuId}>
        <LayoutMainContent className="pb-0">
          <div className={['grid grid-cols-12 relative gap-4'].join(' ')}>
            <div
              className={[
                'relative',
                !props.hideToc ? 'col-span-12 md:col-span-9' : 'col-span-12',
                'transition-all ease-out',
                'duration-100',
              ].join(' ')}
            >
              {props.meta?.breadcrumb && (
                <p className="text-brand tracking-wider mb-3">{props.meta.breadcrumb}</p>
              )}
              <article
                // Used to get headings for the table of contents
                id="sb-docs-guide-main-article"
                className="prose max-w-none"
              >
                <h1 className="mb-0">{props.meta.title}</h1>
                {props.meta?.subtitle && (
                  <h2 className="mt-3 text-xl text-foreground-light">{props.meta.subtitle}</h2>
                )}
                <div className="w-full border-b my-8"></div>
                <MDXProvider components={components}>{props.children}</MDXProvider>

                {EDIT_BUTTON_EXCLUDE_LIST.includes(router.route) ? (
                  <></>
                ) : (
                  <div className="mt-16 not-prose">
                    <div>
                      <a
                        href={`https://github.com/${
                          props.editLink ||
                          `supabase/supabase/edit/master/apps/docs/pages${router.asPath}.mdx`
                        }
                    `}
                        className="text-sm transition flex items-center gap-1 text-scale-1000 hover:text-scale-1200 w-fit"
                      >
                        Edit this page on GitHub <ExternalLink size={14} strokeWidth={1.5} />
                      </a>
                    </div>
                  </div>
                )}
              </article>
            </div>
            {!props.hideToc && !props.meta?.hide_table_of_contents && (
              <GuidesTableOfContents
                video={props.meta?.tocVideo}
                className={cn(
                  'col-span-3 self-start',
                  'hidden md:block md:col-span-3',
                  'sticky top-[calc(var(--mobile-header-height,40px)+2rem)] lg:top-[calc(var(--desktop-header-height,60px)+2rem)]',
                  'max-h-[calc(100vh-60px-5rem)]'
                )}
              />
            )}
          </div>
        </LayoutMainContent>
      </MainSkeleton>
    </>
  )
}

export default Layout
