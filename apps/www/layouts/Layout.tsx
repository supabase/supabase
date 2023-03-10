import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ImageGrid from '~/components/ImageGrid'
import DefaultLayout from '~/components/Layouts/Default'
import Quote from '~/components/Quote'
import mdxComponents from '~/lib/mdx/mdxComponents'

const ignoreClass = 'ignore-on-export'

export default function ContentsLayout({ context }: any) {
  return (
    <DefaultLayout>
      <NextSeo {...context.meta} />
      <MDXProvider components={mdxComponents()}>
        <div className="prose max-w-none">{context.children}</div>
      </MDXProvider>
    </DefaultLayout>
  )
}
