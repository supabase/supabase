import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FC, useEffect, useRef, useState } from 'react'
import { IconExternalLink } from 'ui'
import components from '~/components'
import { highlightSelectedTocItem } from '~/components/CustomHTMLElements/CustomHTMLElements.utils'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import useHash from '~/hooks/useHash'

interface Props {
  meta: {
    title: string
    description?: string
    hide_table_of_contents?: boolean
    breadcrumb?: string
    subtitle?: string
    video?: string
    canonical?: string
  }
  children: any
  toc?: any
  currentPage?: string
  hideToc?: boolean
}

const Layout: FC<Props> = (props) => {
  const [hash] = useHash()

  const articleRef = useRef()
  const [tocList, setTocList] = useState([])

  const { asPath } = useRouter()

  const router = useRouter()

  const EDIT_BUTTON_EXCLUDE_LIST = ['/404']

  useEffect(() => {
    if (hash && tocList.length > 0) {
      highlightSelectedTocItem(hash as string)
    }
  }, [hash, JSON.stringify(tocList)])

  useEffect(() => {
    const articleEl = articleRef.current as HTMLElement

    if (!articleRef.current) return
    const headings = Array.from(articleEl.querySelectorAll('h2, h3'))
    const newHeadings = headings
      .filter((heading) => heading.id)
      .map((heading) => {
        const text = heading.textContent.replace('#', '')
        const link = heading.querySelector('a').getAttribute('href')
        const level = heading.tagName === 'H2' ? 2 : 3
        return { text, link, level }
      })
    setTocList(newHeadings)
  }, [])

  const hasTableOfContents = tocList.length > 0

  const ogPageType = asPath.split('/')[2]

  return (
    <>
      <NextSeo
        title={`${props.meta?.title} | Supabase Docs`}
        description={props.meta?.description ? props.meta?.description : props.meta?.title}
        canonical={props.meta?.canonical ?? `https://supabase.com/docs${asPath}`}
        openGraph={{
          title: props.meta?.title,
          description: props.meta?.description,
          url: `https://supabase.com/docs${asPath}`,
          type: 'article',
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
          images: [
            {
              url: `https://obuldanrptloktxcffvn.functions.supabase.co/og-images?site=docs${
                ogPageType ? `&type=${ogPageType}` : ''
              }&title=${encodeURIComponent(props.meta?.title)}&description=${encodeURIComponent(
                props.meta?.description
              )}`,
            },
          ],
        }}
      />
      <div className={['grid grid-cols-12 relative gap-4'].join(' ')}>
        <div
          className={[
            'relative',
            !props.hideToc ? 'col-span-12 md:col-span-9' : 'col-span-12',
            'transition-all ease-out',
            'duration-100',
          ].join(' ')}
        >
          {props.meta.breadcrumb && (
            <p className="text-brand-900 tracking-wider mb-3">{props.meta.breadcrumb}</p>
          )}
          <article
            ref={articleRef}
            className={`${
              props.meta?.hide_table_of_contents || !hasTableOfContents ? '' : ''
            } prose dark:prose-dark max-w-none`}
          >
            <h1 className="mb-0">{props.meta.title}</h1>
            {props.meta.subtitle && (
              <h2 className="mt-3 text-xl text-scale-1100">{props.meta.subtitle}</h2>
            )}
            <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-800 to-brand-900 my-8"></div>
            <MDXProvider components={components}>{props.children}</MDXProvider>

            {EDIT_BUTTON_EXCLUDE_LIST.includes(router.route) ? (
              <></>
            ) : (
              <div className="mt-16 not-prose">
                <div>
                  <Link
                    href={`https://github.com/supabase/supabase/edit/master/apps/docs/pages${router.asPath}.mdx`}
                    passHref
                  >
                    <a className="text-sm transition flex items-center gap-1 text-scale-1000 hover:text-scale-1200">
                      Edit this page on GitHub <IconExternalLink size={14} strokeWidth={1.5} />
                    </a>
                  </Link>
                </div>
              </div>
            )}
          </article>
        </div>
        {!props.hideToc && hasTableOfContents && !props.meta?.hide_table_of_contents && (
          <div
            className={[
              'col-span-3',
              'border-scale-400 dark:bg-scale-200 table-of-contents-height',
              'thin-scrollbar overflow-y-auto sticky hidden md:block md:col-span-3 px-2',
              'transition-all ease-out',
              'duration-100',
            ].join(' ')}
          >
            <div className="border-l">
              <span className="block font-mono text-xs uppercase text-scale-1200 px-5 mb-6">
                On this page
              </span>
              <GuidesTableOfContents list={tocList} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Layout
