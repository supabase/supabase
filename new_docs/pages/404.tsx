import { ReactElement } from 'react'
import { getDocsBySlug } from '../lib/docs'
import markdownToHtml from '../lib/markdown'
import DocsLayout from '../components/layouts/DocsLayout'

export default function Home({
  meta,
  content,
}: {
  meta: { title: string; description: string }
  content: ReactElement
}) {
  return <DocsLayout meta={meta}>{content}</DocsLayout>
}

export async function getStaticProps() {
  const doc = getDocsBySlug('404')

  const content = await markdownToHtml(doc.content || '')

  return {
    props: {
      ...doc,
      content,
    },
  }
}
