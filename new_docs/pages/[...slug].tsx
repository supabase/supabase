import { ReactElement } from 'react'
import { getAllDocs, getDocsBySlug } from '../lib/docs'
import Layout from '../components/layouts/Layout'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import { MDXProvider } from '@mdx-js/react'
import components from '../components'

export default function Doc({
  meta,
  content,
}: {
  meta: { title: string; description: string }
  content: ReactElement
}) {
  return (
    <Layout meta={meta}>
      <MDXProvider components={components}>
        <MDXRemote {...content} />
      </MDXProvider>
    </Layout>
  )
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  let slug

  if (params.slug.length > 1) {
    slug = `docs/${params.slug.join('/')}`
  } else {
    slug = `docs/${params.slug[0]}`
  }

  let doc = getDocsBySlug(slug)

  const content = await serialize(doc.content || '')

  return {
    props: {
      ...doc,
      content,
    },
  }
}

export function getStaticPaths() {
  let docs = getAllDocs()

  return {
    paths: docs.map(() => {
      return {
        params: {
          slug: docs.map((d) => d.slug),
        },
      }
    }),
    fallback: 'blocking',
  }
}
