import { ReactElement } from 'react'
import Head from 'next/head'
import NavBar from '../nav/NavBar'
import SideBar from '../nav/SideBar'
import Footer from '../Footer'

const DocsLayout = ({
  meta,
  children,
  toc,
  menuItems,
  currentPage,
}: {
  meta: { title: string; description: string }
  children: ReactElement
  toc?: any
  menuItems: any
  currentPage: string
}) => {
  const theme = 'okaidia'

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
        <link
          rel="preload"
          href="https://unpkg.com/prismjs@0.0.1/themes/prism-okaidia.css"
          as="script"
        />
        <link href={`https://unpkg.com/prismjs@0.0.1/themes/prism-${theme}.css`} rel="stylesheet" />
      </Head>

      <main>
        <NavBar currentPage={currentPage} />
        <div className="flex w-full flex-row">
          <SideBar menuItems={menuItems} />
          <div className="docs-width flex w-full grid-cols-12 justify-between p-4 pb-8">
            <div className="w-full p-4">
              <article className="prose dark:prose-dark dark:bg-scale-200 width-full">
                {children}
              </article>
            </div>
            {toc && (
              <div className="prose border-scale-400 dark:bg-scale-200 thin-scrollbar table-of-contents-height w-1/4 border-l px-4">
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

export default DocsLayout
