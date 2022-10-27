import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { menuItems } from '~/components/Navigation/Navigation.constants'
import Layout from '~/layouts/Default'
import { getPageType } from '~/lib/helpers'
import getComponents from '~/lib/mdx/getComponents'

export default function ContentsLayout({ context }: any) {
  const { asPath } = useRouter()
  const page = getPageType(asPath)

  return (
    <>
      <NextSeo {...context.meta} />
      <Layout
        // toc={toc}
        meta={context.meta}
        // @ts-ignore
        menuItems={
          // @ts-ignore
          menuItems[page]
        }
        currentPage={page}
        versions={[]}
      >
        <MDXProvider components={getComponents(context.type)}>
          <div className="prose max-w-none">{context.children}</div>
        </MDXProvider>
      </Layout>
    </>
  )
}
