import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import components from '~/components'
import { menuItems } from '~/components/Navigation/Navigation.constants'

import Layout from '~/layouts/Default'
import { getDocsBySlug } from '../lib/docs'
export default function Home({
  meta,
  content,
}: {
  meta: { title: string; description: string }
  content: any
}) {
  return (
    <Layout meta={meta} menuItems={menuItems['docs']} currentPage="docs">
      <MDXRemote {...content} components={components} />
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
