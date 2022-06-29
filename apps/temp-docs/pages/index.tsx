import { getDocsBySlug } from '../lib/docs'
import Layout from '../components/layouts/DocsLayout'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import { MDXProvider } from '@mdx-js/react'
import components from '../components'
import menuItems from '../components/nav/menu-items.json'

export default function Home({
  meta,
  content,
}: {
  meta: { title: string; description: string }
  content: any
}) {
  return (
    <Layout meta={meta} menuItems={menuItems['Docs']} currentPage="Docs">
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
