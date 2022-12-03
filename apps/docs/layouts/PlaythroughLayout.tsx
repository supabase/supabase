import { MDXProvider } from '@mdx-js/react'
import React, { useEffect, FC } from 'react'
import { NextSeo } from 'next-seo'
import NavBar from '../components/Navigation/NavBar'
import SideBar from '../components/Navigation/SideBar'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import { getPageType } from '../lib/helpers'
import components from '~/components'
import { menuItems } from '../components/Navigation/Navigation.constants'
import { Playthrough } from '~/components/Playthrough'
import { childrenToSteps } from '~/components/Playthrough/step-parser'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean }
  children: any
  toc?: any
  currentPage: string
}

function Chapter({ children }) {
  return <section>{children}</section>
}

function Step() {
  return <div>Step</div>
}

const mdxComponents = {
  ...components,
  Chapter,
  Step,
}

const Layout: FC<Props> = ({ meta, children }) => {
  const { asPath } = useRouter()
  const page = getPageType(asPath)

  const data = childrenToSteps(children)

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    if (!key) {
      // Default to dark mode if no preference config
      document.documentElement.className = 'dark'
    } else {
      document.documentElement.className = key === 'true' ? 'dark' : ''
    }
  }, [])

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
        <div className="flex w-full flex-row ">
          <SideBar menuItems={menuItems[page]} />
          <div className="main-content-pane docs-width w-full">
            <article>
              <MDXProvider components={mdxComponents}>
                <Playthrough steps={data.steps}>{data.children}</Playthrough>
              </MDXProvider>
            </article>
          </div>
        </div>
        <Footer />
      </main>
    </>
  )
}

export default Layout
