import { getDocsBySlug } from '../lib/docs'
import Layout from '../components/layouts/Layout'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import { MDXProvider } from '@mdx-js/react'
import components from '../components'

export default function Home({
  meta,
  content,
}: {
  meta: { title: string; description: string }
  content: any
}) {
  return (
    <Layout meta={meta}>
      <MDXProvider components={components}>
        <MDXRemote {...content} />
      </MDXProvider>
    </Layout>
  )
}

export async function getStaticProps() {
  const doc = getDocsBySlug('docs/introduction')

  const content = await serialize(doc.content || '')

  return {
    props: {
      ...doc,
      content,
    },
  }
}
