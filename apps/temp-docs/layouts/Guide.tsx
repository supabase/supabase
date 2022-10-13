import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import menuItems from '~/components/nav/menu-items.json'
import Layout from '~/layouts/DocsLayout'
import { getPageType } from '~/lib/helpers'
import getComponents from '~/lib/mdx/getComponents'

export default function ContentsLayout({ context }: any) {
  const { asPath } = useRouter()
  const page = getPageType(asPath)

  console.log('page', page)

  return (
    <>
      <NextSeo {...context.meta} />
      <Layout
        meta={context.meta}
        // toc={toc}
        menuItems={menuItems[page]}
        currentPage={page}
      >
        <MDXProvider components={getComponents(context.type)}>
          <div className="prose max-w-none">{context.children}</div>
        </MDXProvider>
      </Layout>
    </>
  )
}
