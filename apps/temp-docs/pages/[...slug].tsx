import { getAllDocs, getDocsBySlug } from '../lib/docs'
import Layout from '../components/layouts/Layout'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import { MDXProvider } from '@mdx-js/react'
import components from '../components/index'
import menuItems from '../components/nav/menu-items.json'
import { useRouter } from 'next/router'

// table of contents extractor
const toc = require('markdown-toc')

export default function Doc({
  meta,
  content,
  toc,
}: {
  meta: { title: string; description: string }
  content: any
  toc: any
}) {
  const { asPath } = useRouter()
  let page
  switch (asPath) {
    case '/guides':
    case '/guides/local-development':
    case /\/guides\/[a-zA-Z]*\/[a-zA-Z\-]*/.test(asPath) && asPath:
      page = 'Guides'
      break
    case asPath.includes('/reference') && asPath:
      page = 'Reference'
      break
    default:
      page = 'Docs'
      break
  }

  return (
    // @ts-ignore
    <Layout meta={meta} toc={toc} menuItems={menuItems[page]} currentPage={page}>
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
