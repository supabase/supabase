import { ReactElement, useState } from 'react'
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
  children: string
  toc: any
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
        <link rel="icon" href="/docs/favicon.ico" />
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
        <div className="flex flex-row">
          <SideBar menuItems={menuItems} />
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12">
            <article className="prose dark:prose-dark col-span-8 max-w-none p-8">
              {children}
            </article>
            <div className="prose dark:prose-dark col-span-4 max-w-none p-8">
              <h5>On this page</h5>
              {toc
                ? toc.json.map((item: any) => {
                    return (
                      <li>
                        <a href={`#${item.slug}`}>{item.content}</a>
                      </li>
                    )
                  })
                : 'Please note: No TOC on this page'}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </>
  )
}

export default DocsLayout
