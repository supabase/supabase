import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ImageGrid from '~/components/ImageGrid'
import DefaultLayout from '~/components/Layouts/Default'
import Quote from '~/components/Quote'

const ignoreClass = 'ignore-on-export'

function getComponents(type: any) {
  const components = {
    CodeBlock,
    Quote,
    Avatar,
    code: (props: any) => {
      if (props.className !== ignoreClass) {
        return <CodeBlock {...props} />
      } else {
        return <code {...props} />
      }
    },
    ImageGrid,
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
  return (
    <DefaultLayout>
      <NextSeo {...context.meta} />
      <MDXProvider components={getComponents(context.type)}>
        <div className="prose max-w-none">{context.children}</div>
      </MDXProvider>
    </DefaultLayout>
  )
}
