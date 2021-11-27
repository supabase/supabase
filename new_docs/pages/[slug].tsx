import { ReactElement } from 'react'
import { getAllDocs, getDocsBySlug } from '../lib/docs'
import markdownToHtml from '../lib/markdown'
import DocsLayout from '../components/layouts/DocsLayout'

export default function Doc({
  meta,
  content,
}: {
  meta: { title: string; description: string }
  content: ReactElement
}) {
  return <DocsLayout meta={meta}>{content}</DocsLayout>
}

export async function getStaticProps({
  params,
}: {
  params: { slug: string; meta: { [key: string]: any }; content: string }
}) {
  let doc = getDocsBySlug(params.slug)

  if (!doc) {
    doc = getDocsBySlug('404')
  }

  const content = await markdownToHtml(doc.content || '')

  return {
    props: {
      ...doc,
      content,
    },
  }
}

export async function getStaticPaths() {
  const docs = getAllDocs()

  return {
    paths: docs.map((doc) => {
      return {
        params: {
          ...doc,
        },
      }
    }),
    fallback: false,
  }
}
