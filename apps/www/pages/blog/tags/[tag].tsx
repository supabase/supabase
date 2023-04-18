import { NextSeo } from 'next-seo'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import Link from 'next/link'

import DefaultLayout from '~/components/Layouts/Default'
import BlogListItem from '~/components/Blog/BlogListItem'
import PostTypes from '~/types/post'

export async function getStaticProps({ params }: any) {
  const posts = getSortedPosts('_blog', 0, [params.tag])
  return {
    props: {
      tag: params.tag,
      blogs: posts,
    },
  }
}

export async function getStaticPaths() {
  const categories = getAllCategories('_blog')
  return {
    paths: categories.map((category: any) => ({ params: { tag: category } })),
    fallback: false,
  }
}

interface Props {
  tag: string
  blogs: PostTypes[]
}

function TagBlogsPage(props: Props) {
  const { blogs, tag } = props
  return (
    <>
      <NextSeo title={`Blog | ${tag}`} description="Latest news from the Supabase team." />
      <DefaultLayout>
        <div className="container mx-auto px-8 py-16 sm:px-16 xl:px-20">
          <div className="text-scale-1000 flex space-x-1">
            <h1 className="cursor-pointer">
              <Link href="/blog">Blog</Link>
              <span className="px-2">/</span>
              <span>{`${tag}`}</span>
            </h1>
          </div>
          <ol className="grid grid-cols-12 gap-8 py-16 lg:gap-16">
            {blogs.map((blog: PostTypes, idx: number) => (
              <div
                className="col-span-12 mb-16 md:col-span-12 lg:col-span-6 xl:col-span-4"
                key={idx}
              >
                <BlogListItem post={blog} />
              </div>
            ))}
          </ol>
        </div>
      </DefaultLayout>
    </>
  )
}

export default TagBlogsPage
