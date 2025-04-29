import { NextSeo } from 'next-seo'
import { getSortedPosts, getAllTags } from '~/lib/posts'
import { getAllCMSPosts } from '~/lib/cms-posts'
import Link from 'next/link'
import { startCase } from 'lodash'

import DefaultLayout from '~/components/Layouts/Default'
import BlogGridItem from '~/components/Blog/BlogGridItem'
import PostTypes from '~/types/post'

export async function getStaticProps({ params }: any) {
  const staticPosts = getSortedPosts({ directory: '_blog', limit: 0, tags: [params.tag] })

  // Get CMS posts
  const allCmsPosts = await getAllCMSPosts()

  // Filter CMS posts by tag (when tag functionality is added to CMS)
  const cmsPosts = allCmsPosts.filter((post: any) => post.tags && post.tags.includes(params.tag))

  // Combine and sort all posts
  const allPosts = [...staticPosts, ...cmsPosts].sort((a: any, b: any) => {
    const dateA = new Date(a.date || a.publishedAt).getTime()
    const dateB = new Date(b.date || b.publishedAt).getTime()
    return dateB - dateA
  })

  return {
    props: {
      tag: params.tag,
      blogs: allPosts,
    },
    revalidate: 60 * 10, // Revalidate every 10 minutes
  }
}

export async function getStaticPaths() {
  const tags = getAllTags('_blog')

  // Note: When you add tags to CMS, you should merge them with static tags
  // const cmsPosts = await getAllCMSPosts()
  // const cmsTags = Array.from(new Set(cmsPosts.flatMap(post => post.tags || [])))
  // const allTags = Array.from(new Set([...tags, ...cmsTags]))

  return {
    paths: tags.map((tag: any) => ({ params: { tag: tag } })),
    fallback: 'blocking', // Change to blocking to support new tags from CMS
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
            {blogs.length > 0 ? (
              blogs.map((blog: PostTypes, idx: number) => (
                <div
                  className="col-span-12 mb-16 md:col-span-12 lg:col-span-6 xl:col-span-4"
                  key={idx}
                >
                  <BlogGridItem post={blog} />
                </div>
              ))
            ) : (
              <div className="col-span-12">
                <p className="text-foreground-lighter">No posts found with this tag.</p>
              </div>
            )}
          </ol>
        </div>
      </DefaultLayout>
    </>
  )
}

export default TagBlogsPage
