import type { Metadata } from 'next'
import { getAllPostSlugs, getPostdata, getSortedPosts } from 'lib/posts'
import matter from 'gray-matter'
import { mdxSerialize } from 'lib/mdx/mdxSerialize'
import CaseStudyClient from './CaseStudyClient'

type Params = { slug: string }

export async function generateStaticParams() {
  const paths = getAllPostSlugs('_customers')
  return paths.map((p) => ({ slug: p.params.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const content = await getPostdata(params.slug, '_customers')
  const { data } = matter(content)
  const title = data.meta_title ?? `${data.name} | Supabase Customer Stories`
  const description = data.meta_description ?? data.description
  const image = data.og_image ?? 'https://supabase.com/images/customers/og/customer-stories.jpg'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [{ url: image }],
    },
  }
}

export default async function CustomerSlugPage({ params }: { params: Params }) {
  const filePath = params.slug
  const postContent = await getPostdata(filePath, '_customers')
  const { data, content } = matter(postContent)
  const mdxSource: any = await mdxSerialize(content)

  const allPosts = getSortedPosts({ directory: '_customers' })
  const currentIndex = allPosts.map((e) => e.slug).indexOf(filePath)
  const nextPost = allPosts[currentIndex + 1]
  const prevPost = allPosts[currentIndex - 1]

  return (
    <CaseStudyClient
      blog={{ slug: params.slug, content: mdxSource, source: content, ...data }}
      prevPost={currentIndex === 0 ? null : prevPost ?? null}
      nextPost={currentIndex === allPosts.length ? null : nextPost ?? null}
    />
  )
}
