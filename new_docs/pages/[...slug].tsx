import { ReactElement } from 'react'
import { getAllDocs, getDocsBySlug } from '../lib/docs'
import Layout from '../components/layouts/Layout'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import { MDXProvider } from '@mdx-js/react'
import components from '../components/index'
import { Tabs } from '@supabase/ui'

// table of contents extractor
const toc = require('markdown-toc')

export default function Doc({
  meta,
  content,
  toc,
}: {
  meta: { title: string; description: string }
  content: ReactElement
  toc: any
}) {
  console.log('content', content)
  console.log('meta', meta)
  console.log('toc', toc)
  return (
    <Layout meta={meta} toc={toc}>
      <MDXProvider components={components}>
        <MDXRemote {...content} components={components} />
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
      toc: toc(doc.content, { maxdepth: 2 }),
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
