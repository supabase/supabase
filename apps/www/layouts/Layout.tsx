import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

export default function ContentsLayout({ context, meta }: any) {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <MDXProvider components={mdxComponents()}>
        <div className="prose max-w-none">{context.children}</div>
      </MDXProvider>
    </DefaultLayout>
  )
}
