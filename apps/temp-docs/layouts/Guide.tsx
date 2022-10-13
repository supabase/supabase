import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import { useRouter } from 'next/router'
import menuItems from '~/components/nav/menu-items.json'
import Layout from '~/layouts/DocsLayout'
import { getPageType } from '~/lib/helpers'

const ignoreClass = 'ignore-on-export'

function getComponents(type: any) {
  const components = {
    img: (props: any) => {
      if (props.className !== ignoreClass) {
        return (
          <div
            className={[
              'next-image--dynamic-fill',
              type === 'blog' && 'to-scale-400 from-scale-500 rounded-lg border bg-gradient-to-r',
            ].join(' ')}
          >
            <Image
              {...props}
              className={['next-image--dynamic-fill', type === 'blog' && 'rounded-md border'].join(
                ' '
              )}
              layout="fill"
            />
          </div>
        )
      }
      return <img {...props} />
    },
  }

  return components
}

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
