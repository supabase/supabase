import { MDXProvider } from '@mdx-js/react'
import React, { useEffect, FC, useRef, useState } from 'react'
import { NextSeo } from 'next-seo'
import NavBar from '../components/Navigation/NavBar'
import SideBar from '../components/Navigation/SideBar'
import Footer from '../components/Footer'
import GuidesTableOfContents from '~/components/GuidesTableOfContents'
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

const Layout: FC<Props> = ({ meta, children }) => {
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

      <main className="h-screen flex flex-col">
        <NavBar currentPage={page} />
        <div className="flex w-full flex-row flex-1">
          <SideBar menuItems={menuItems[page]} />
          <div className="main-content-pane docs-width w-full">
            <article ref={articleRef} className="h-full">
              <MDXProvider components={components}>{children}</MDXProvider>
            </article>
          </div>
        </div>
        {/* <Footer /> */}
      </main>
    </>
  )
}

export default Layout
