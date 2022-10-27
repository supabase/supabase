import { useEffect, FC } from 'react'
import Head from 'next/head'
import NavBar from '../components/Navigation/NavBar'
import SideBar from '../components/Navigation/SideBar'
import Footer from '../components/Footer'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean }
  children: any
  toc?: any
  menuItems: any
  currentPage: string
}

const Layout: FC<Props> = ({ meta, children, toc, menuItems, currentPage }) => {
  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    if (!key) {
      // Default to dark mode if no preference config
      document.documentElement.className = 'dark'
    } else {
      document.documentElement.className = key === 'true' ? 'dark' : ''
    }
  }, [])

  console.log('Default:Layout', { currentPage })

  return (
    <>
      <Head>
        <title>{meta?.title} | Supabase</title>
        <meta name="description" content={meta?.description} />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={meta?.title} />
        <meta property="og:description" content={meta?.description} />
        <meta property="og:title" content={meta?.title} />
        {/* <link
          rel="preload"
          href="https://unpkg.com/prismjs@0.0.1/themes/prism-okaidia.css"
          as="script"
        /> */}
        {/* <link href={`https://unpkg.com/prismjs@0.0.1/themes/prism-${theme}.css`} rel="stylesheet" /> */}
      </Head>

      <main>
        <NavBar currentPage={currentPage} />
        <div className="flex w-full flex-row">
          <SideBar menuItems={menuItems} />
          <div className="docs-width grid grid-cols-12 gap-4 justify-between p-4 pb-8 w-full">
            <div
              className={`${
                meta?.hide_table_of_contents ? 'col-span-12' : 'col-span-10 xl:col-span-8'
              } py-4 px-8`}
            >
              <article className="prose dark:prose-dark dark:bg-scale-200 width-full mt-8">
                {children}
              </article>
            </div>
            {toc && !meta?.hide_table_of_contents && (
              <div className="prose border-scale-400 dark:bg-scale-200 thin-scrollbar table-of-contents-height col-span-4 border-l px-4">
                <h5>On this page</h5>
                <ul className="list-none pl-2 text-[0.8rem]">
                  {toc.json.map((item: any, i: number) => {
                    return (
                      <li key={i}>
                        <a href={`#${item.slug}`}>{item.content}</a>
                      </li>
                    )
                  })}
                </ul>
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
