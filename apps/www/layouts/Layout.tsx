import { MDXProvider } from '@mdx-js/react'
import { useRouter } from 'next/router'

import Image from 'next/image'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ImageGrid from '~/components/ImageGrid'
import Quote from '~/components/Quote'

// plugins for next-mdx-remote
import DefaultLayout from '~/components/Layouts/Default'
import { NextSeo } from 'next-seo'

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
  const router = useRouter()

  console.log(context)

  return (
    <DefaultLayout>
      <NextSeo {...context.meta} />
      <MDXProvider components={getComponents(context.type)}>
        <div className="prose max-w-none">{context.children}</div>
      </MDXProvider>
    </DefaultLayout>
  )
}
