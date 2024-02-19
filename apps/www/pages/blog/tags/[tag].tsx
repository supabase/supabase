import { NextSeo } from 'next-seo'
import { getSortedPosts, getAllTags } from '~/lib/posts'
import Link from 'next/link'
import { startCase } from 'lodash'

import DefaultLayout from '~/components/Layouts/Default'
import BlogGridItem from '~/components/Blog/BlogGridItem'
import PostTypes from '~/types/post'

export async function getStaticProps({ params }: any) {
  const posts = getSortedPosts({ directory: '_blog', limit: 0, tags: [params.tag] })
  return {
    props: {
      tag: params.tag,
      blogs: posts,
    },
  }
}

export async function getStaticPaths() {
  const tags = getAllTags('_blog')
  return {
    paths: tags.map((tag: any) => ({ params: { tag: tag } })),
    fallback: false,
  }
}

interface Props {
  tag: string
  blogs: PostTypes[]
}

function TagBlogsPage(props: Props) {
  const { blogs, tag } = props
  const capitalizedTag = startCase(tag.replaceAll('-', ' '))

  return (
    <>
      <NextSeo
        title={`Blog | ${capitalizedTag}`}
        description="Latest news from the Supabase team."
      />
      <DefaultLayout>
        <div className="container mx-auto px-8 py-16 sm:px-16 xl:px-20">
          <div className="text-foreground-lighter flex space-x-1">
            <h1 className="cursor-pointer">
              <Link href="/blog">Blog</Link>
              <span className="px-2">/</span>
              <span>{`${capitalizedTag}`}</span>
            </h1>
          </div>
          <ol className="grid grid-cols-12 gap-8 py-16 lg:gap-16">
            {blogs.map((blog: PostTypes, idx: number) => (
              <div
                className="col-span-12 mb-16 md:col-span-12 lg:col-span-6 xl:col-span-4"
                key={idx}
              >
                <BlogGridItem post={blog} />
              </div>
            ))}
          </ol>
        </div>
      </DefaultLayout>
    </>
  )
}

export default TagBlogsPage
