import type { Metadata } from 'next'
import Link from 'next/link'
import DefaultLayout from 'components/Layouts/Default'
import BlogGridItem from 'components/Blog/BlogGridItem'

import { getAllCMSPosts } from 'lib/get-cms-posts'
import { capitalize } from 'lib/helpers'
import { getSortedPosts, getAllCategories } from 'lib/posts'
import type PostTypes from 'types/post'

type Params = { category: string }

export async function generateStaticParams() {
  const categories = getAllCategories('_blog')
  return categories.map((category: string) => ({ category }))
}

export const revalidate = 30
export const dynamic = 'force-static'

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const capitalizedCategory = capitalize(params?.category.replaceAll('-', ' '))
  return {
    title: `Blog | ${capitalizedCategory}`,
    description: 'Latest news from the Supabase team.',
  }
}

export default async function CategoriesPage({ params }: { params: Params }) {
  const staticPosts = getSortedPosts({
    directory: '_blog',
    limit: 0,
    categories: [params.category],
  })
  const cmsPosts = await getAllCMSPosts()
  const blogs = [
    ...(staticPosts as any[]),
    ...(cmsPosts as any[]).filter((p) => (p.categories || []).includes(params.category)),
  ] as unknown as PostTypes[]
  const capitalizedCategory = capitalize(params?.category.replaceAll('-', ' '))

  return (
    <>
      <DefaultLayout>
        <div className="container mx-auto px-8 py-16 sm:px-16 xl:px-20">
          <div className="text-foreground-lighter flex space-x-1">
            <h1 className="cursor-pointer">
              <Link href="/blog">Blog</Link>
              <span className="px-2">/</span>
              <span>{capitalizedCategory}</span>
            </h1>
          </div>
          <ol className="grid grid-cols-12 gap-8 py-16 lg:gap-16">
            {blogs.map((blog: PostTypes) => (
              <div
                className="col-span-12 mb-16 md:col-span-12 lg:col-span-6 xl:col-span-4"
                key={blog.slug}
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
