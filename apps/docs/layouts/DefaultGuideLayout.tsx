import { MDXProvider } from '@mdx-js/react'
import { useEffect, FC, useRef, useState } from 'react'
import Head from 'next/head'
import NavBar from '../components/Navigation/NavBar'
import SideBar from '../components/Navigation/SideBar'
import Footer from '../components/Footer'
import TableOfContents from '~/components/TableOfContents'
import { useRouter } from 'next/router'
import { getPageType } from '../lib/helpers'
import components from '~/components'
import { menuItems } from '../components/Navigation/Navigation.constants'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean }
  children: any
  toc?: any
  currentPage: string
}

const Layout: FC<Props> = ({ meta, children, toc: pageToc, currentPage }) => {
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

  const articleRef = useRef()
  const [headingsArr, setHeadingsArr] = useState([])

  useEffect(() => {
    const articleEl = articleRef.current as HTMLElement

    if (!articleRef.current) return
    const headings = Array.from(articleEl.querySelectorAll('h2, h3, h4'))
    setHeadingsArr(headings)
    console.log(headings)
  }, [])

  function generateTocItem(item) {
    const id = item.id
    console.log(id)
  }

  const hasTableOfContents = true
  // pageToc !== undefined &&
  // pageToc.json.filter((item) => item.lvl !== 1 && item.lvl <= 3).length > 0

  return (
    <>
      <Head>
        <title>{meta?.title} | Supabase</title>
        <meta name="description" content={meta?.description} />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/docs/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={meta?.title} />
        <meta property="og:description" content={meta?.description} />
        <meta property="og:title" content={meta?.title} />
      </Head>

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
                {headingsArr.length > 0 && headingsArr.map((item) => generateTocItem(item))}

                {/* <TableOfContents toc={pageToc} /> */}
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
