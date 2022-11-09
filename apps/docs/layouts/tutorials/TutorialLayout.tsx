import { MDXProvider } from '@mdx-js/react'
import Head from 'next/head'
import { FC, useEffect } from 'react'
import Footer from '~/components/Footer'
import SideBar from '~/components/Navigation/SideBar'
import TableOfContents from '~/components/TableOfContents'
import { Tabs } from 'ui'

// var toc = require('markdown-toc')

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean; video?: string }
  children: any
  toc?: any
  menuItems: any
  currentPage: string
}

const Layout: FC<Props> = (props: Props) => {
  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    if (!key) {
      // Default to dark mode if no preference config
      document.documentElement.className = 'dark'
    } else {
      document.documentElement.className = key === 'true' ? 'dark' : ''
    }
  }, [])

  // const contentString = renderToString(props.children)

  // const content = serialize(contentString || '')

  // console.log(props)

  // const _toc = /toc(children, { maxdepth: 1, firsth1: false })

  const MDXComponents = {
    Tabs: Tabs,
  }

  const hasTableOfContents =
    props.toc !== undefined &&
    props.toc.json.filter((item) => item.lvl !== 1 && item.lvl <= 3).length > 0

  return (
    <>
      <Head>
        <title>{props.meta?.title} | Supabase</title>
        <meta name="description" content={props.meta?.description} />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/docs/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={props.meta?.title} />
        <meta property="og:description" content={props.meta?.description} />
        <meta property="og:title" content={props.meta?.title} />
      </Head>

      <main>
        {/* <NavBar currentPage={currentPage} /> */}
        <div className="flex w-full flex-row">
          <SideBar menuItems={props.menuItems} />
          <div className="main-content-pane docs-width grid md:grid-cols-12 gap-4 justify-between p-4 pb-8 w-full">
            <div
              className={`${
                props.meta?.hide_table_of_contents || !hasTableOfContents
                  ? 'col-span-12 xl:col-start-2 xl:col-span-10 2xl:col-start-3 2xl:col-span-8'
                  : 'col-span-12 md:col-span-9'
              } py-2 md:py-4 px-2 md:px-8`}
            >
              <p className="text-brand-900 tracking-wider">Tutorials</p>
              <article className="prose dark:prose-dark dark:bg-scale-200 max-w-4xl mt-8">
                <h1>{props.meta.title}</h1>
                <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-800 to-brand-900 my-16"></div>
                <MDXProvider components={MDXComponents} children={props.children} />
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
        </div>
        <Footer />
      </main>
    </>
  )
}

export default Layout
