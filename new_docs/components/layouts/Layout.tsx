import { ReactElement, useState } from 'react'
import Head from 'next/head'
import styles from '../../styles/Home.module.css'
import NavBar from '../nav/NavBar'
import SideBar from '../nav/SideBar'
import Footer from '../Footer'

const DocsLayout = ({
  meta,
  children,
  toc,
}: {
  meta: { title: string; description: string }
  children: string
  toc: any
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
        <NavBar />
        <div className="flex flex-row">
          <SideBar />
          <div className="grid grid-cols-12 w-full max-w-7xl mx-auto">
            <article className="col-span-8 prose dark:prose-dark p-8 max-w-none">
              {children}
            </article>
            <div className="col-span-4 prose dark:prose-dark p-8 max-w-none">
              <h5>On this page</h5>
              {toc.json.map((item: any) => {
                return (
                  <li>
                    <a href={`#${item.slug}`}>{item.content}</a>
                  </li>
                )
              })}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </>
  )
}

export default DocsLayout
