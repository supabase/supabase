import { NextSeo } from 'next-seo'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import Link from 'next/link'

import DefaultLayout from '~/components/Layouts/Default'
import BlogListItem from '~/components/Blog/BlogListItem'
import PostTypes from '~/types/post'
import BlogHeader from '~/components/Blog/BlogHeader'
import { Typography } from '@supabase/ui'

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
        <div className="container mx-auto px-8 sm:px-16 xl:px-20 py-16">
          <div className="flex space-x-1">
            <Typography.Text type="secondary" className="cursor-pointer">
              <Link href="/blog">Blog</Link>
            </Typography.Text>
            <Typography.Text type="secondary">/</Typography.Text>
            <Typography.Text>{`${tag}`}</Typography.Text>
          </div>
          <ol className="grid grid-cols-12 py-16 gap-8 lg:gap-16">
            {blogs.map((blog: PostTypes, idx: number) => (
              <div className="col-span-12 md:col-span-12 lg:col-span-6 xl:col-span-4 mb-16">
                <BlogListItem blog={blog} key={idx} />
              </div>
            ))}
          </ol>
        </div>
      </DefaultLayout>
    </>
  )
}

export default TagBlogsPage
