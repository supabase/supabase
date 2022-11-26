import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { FC, useEffect, useRef, useState } from 'react'
import components from '~/components'
import { highlightSelectedTocItem } from '~/components/CustomHTMLElements/CustomHTMLElements.utils'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import useHash from '~/hooks/useHash'
import { getPageType } from '~/lib/helpers'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean }
  children: any
  toc?: any
  currentPage: string
}

const Layout: FC<Props> = (props) => {
  const [hash] = useHash()
  const [active, setActive] = useState(false)

  const articleRef = useRef()
  const [tocList, setTocList] = useState([])

  const { asPath } = useRouter()
  const page = getPageType(asPath)

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    if (!key) {
      // Default to dark mode if no preference config
      document.documentElement.className = 'dark'
    } else {
      document.documentElement.className = key === 'true' ? 'dark' : ''
    }
  }, [])

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

  useEffect(() => {
    setTimeout(function () {
      setActive(true)
    }, 150)
  }, [])

  const hasTableOfContents = tocList.length > 0

  return (
    <>
      <NextSeo
        title={`${props.meta?.title} | Supabase`}
        description={props.meta?.description ? props.meta?.description : props.meta?.title}
        openGraph={{
          title: props.meta?.title,
          description: props.meta?.description,
          url: `https://supabase.com/docs${asPath}`,
          images: [
            {
              url: `https://supabase.com/docs/img/supabase-og-image.png`,
            },
          ],
        }}
      />

      <div className={['grid grid-cols-12 relative'].join(' ')}>
        <div
          className={[
            'relative',
            'col-span-9',
            'transition-all ease-out',
            'duration-100',
            active ? 'opacity-100 left-0' : 'opacity-0 left-6',
          ].join(' ')}
        >
          <p className="text-brand-900 tracking-wider">Guides</p>
          <article
            ref={articleRef}
            className={`${
              props.meta?.hide_table_of_contents || !hasTableOfContents ? '' : ''
            } prose dark:prose-dark max-w-none`}
          >
            <h1>{props.meta.title}</h1>
            <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-800 to-brand-900 my-16"></div>
            <MDXProvider components={components}>{props.children}</MDXProvider>
          </article>
        </div>
        {hasTableOfContents && !props.meta?.hide_table_of_contents && (
          <div
            className={[
              'col-span-3',
              'border-scale-400 dark:bg-scale-200 table-of-contents-height',
              'thin-scrollbar overflow-y-auto sticky hidden md:block md:col-span-3 px-2',
              'transition-all ease-out',
              'duration-100',
              active ? 'opacity-100 left-0' : 'opacity-0 left-6',
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
