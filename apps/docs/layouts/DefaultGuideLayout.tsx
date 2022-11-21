import { MDXProvider } from '@mdx-js/react'
import { useEffect, FC, useRef, useState } from 'react'
import { NextSeo } from 'next-seo'
import NavBar from '../components/Navigation/NavBar'
import SideBar from '../components/Navigation/SideBar'
import Footer from '../components/Footer'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
import { useRouter } from 'next/router'
import { getPageType } from '../lib/helpers'
import components from '~/components'
import { menuItems } from '../components/Navigation/Navigation.constants'
import TableOfContents from '~/components/TableOfContents'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean; video?: string }
  children: any
  toc?: any
  currentPage: string
}

const Layout: FC<Props> = (props) => {
  switch (process.env.NEXT_PUBLIC_NEW_DOCS) {
    case 'true':
      console.log('new layout')
      return newLayout(props)
      break
    default:
      console.log('old layout')
      return archivedLayout(props)
      break
  }
}

const newLayout: FC<Props> = (props) => {
  const { asPath } = useRouter()
  const page = getPageType(asPath)

  const [active, setActive] = useState(false)

  console.log('page', page)

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    if (!key) {
      // Default to dark mode if no preference config
      document.documentElement.className = 'dark'
    } else {
      document.documentElement.className = key === 'true' ? 'dark' : ''
    }
  }, [])

  const articleRef = useRef()
  const [tocList, setTocList] = useState([])

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

      <div
        className={[
          'relative transition-all ease-out',
          'duration-150',
          active ? 'opacity-100 left-0' : 'opacity-0 left-10',
        ].join(' ')}
      >
        <div>
          <p className="text-brand-900 tracking-wider">Guides</p>
          <article className={['prose dark:prose-dark ', 'max-w-none'].join(' ')}>
            <h1>{props.meta.title}</h1>
            <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-800 to-brand-900 my-16"></div>

            <MDXProvider components={components} children={props.children} />
          </article>
        </div>
        {hasTableOfContents && !props.meta?.hide_table_of_contents && (
          <div
            className={[
              'border-scale-400 dark:bg-scale-200 table-of-contents-height border-l',
              'thin-scrollbar overflow-y-auto sticky hidden md:block md:col-span-3 px-2',
            ].join(' ')}
          >
            <TableOfContents toc={props.toc} video={props.meta.video} />
          </div>
        )}
      </div>
    </>
  )
}

const archivedLayout: FC<Props> = ({ meta, children }) => {
  const { asPath } = useRouter()
  const page = getPageType(asPath)

  console.log('page', page)

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    if (!key) {
      // Default to dark mode if no preference config
      document.documentElement.className = 'dark'
    } else {
      document.documentElement.className = key === 'true' ? 'dark' : ''
    }
  }, [])

  const articleRef = useRef()
  const [tocList, setTocList] = useState([])

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

  return (
    <>
      <NextSeo
        title={`${meta?.title} | Supabase`}
        description={meta?.description ? meta?.description : meta?.title}
        openGraph={{
          title: meta?.title,
          description: meta?.description,
          url: `https://supabase.com/docs${asPath}`,
          images: [
            {
              url: `https://supabase.com/docs/img/supabase-og-image.png`,
            },
          ],
        }}
      />

      <main>
        <NavBar currentPage={page} />
        <div className="flex w-full flex-row">
          <SideBar menuItems={menuItems[page]} />
          <div className="main-content-pane docs-width grid md:grid-cols-12 gap-4 justify-between p-4 pb-8 w-full">
            <div
              className={`${
                meta?.hide_table_of_contents || !hasTableOfContents
                  ? 'col-span-12 xl:col-start-2 xl:col-span-10 2xl:col-start-3 2xl:col-span-8'
                  : 'col-span-12 lg:col-span-9'
              } py-2 lg:py-4 px-2 lg:px-8 mx-auto`}
            >
              <article
                ref={articleRef}
                className={`${
                  meta?.hide_table_of_contents || !hasTableOfContents ? 'xl:min-w-[880px]' : ''
                } doc-content-container prose dark:prose-dark dark:bg-scale-200 width-full mt-8 2xl:max-w-[880px]`}
              >
                {meta?.title && <h1>{meta.title}</h1>}
                <MDXProvider components={components}>{children}</MDXProvider>
              </article>
            </div>
            {hasTableOfContents && !meta?.hide_table_of_contents && (
              <div
                className={[
                  'border-scale-400 dark:bg-scale-200 table-of-contents-height border-l',
                  'thin-scrollbar overflow-y-auto sticky hidden xl:block md:col-span-3 px-2',
                ].join(' ')}
              >
                <GuidesTableOfContents list={tocList} />
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </>
  )
}

export default Layout
