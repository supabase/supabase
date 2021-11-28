import { ReactElement } from 'react'
import { getDocsBySlug } from '../lib/docs'
import markdownToHtml from '../lib/markdown'
import Layout from '../components/layouts/Layout'

export default function Home({
  meta,
  content,
}: {
  meta: { title: string; description: string }
  content: ReactElement
}) {
  return <Layout meta={meta}>{content}</Layout>
}

export async function getStaticProps() {
  const doc = getDocsBySlug('docs/introduction')

  const content = await markdownToHtml(doc.content || '')

  return {
    props: {
      ...doc,
      content,
    },
  }
}
