import { MDXProvider } from '@mdx-js/react'
import { useRouter } from 'next/router'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import components from '../components/index'
import { menuItems } from '../components/Navigation/Navigation.constants'
import { getPageType } from '../lib/helpers'
import { getAllDocs, getDocsBySlug, getLibraryVersions } from '../lib/docs'
import Layout from '~/layouts/Default'

// table of contents extractor
const toc = require('markdown-toc')

interface Meta {
  id: string
  title: string
  sidebar_label: string
  hide_table_of_contents: boolean
}

export default function Doc({
  meta,
  content,
  versions,
  toc,
}: {
  meta: Meta
  content: any
  versions: string[]
  toc: any
}) {
  const { asPath } = useRouter()
  const page = getPageType(asPath)

  return (
    // @ts-ignore
    <Layout
      meta={meta}
      toc={toc}
      menuItems={menuItems[page]}
      currentPage={page}
      versions={versions}
    >
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
  const versions = getLibraryVersions(slug)

  return {
    props: {
      ...doc,
      content,
      versions,
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
