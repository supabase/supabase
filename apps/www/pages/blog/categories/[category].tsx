import { NextSeo } from 'next-seo'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import Link from 'next/link'
import { startCase } from 'lodash'

import DefaultLayout from '~/components/Layouts/Default'
import BlogGridItem from '~/components/Blog/BlogGridItem'
import type PostTypes from '~/types/post'

export async function getStaticProps({ params }: any) {
  const posts = getSortedPosts({ directory: '_blog', limit: 0, categories: [params.category] })
  return {
    props: {
      category: params.category,
      blogs: posts,
    },
  }
}

export async function getStaticPaths() {
  const categories = getAllCategories('_blog')
  return {
    paths: categories.map((category: any) => ({ params: { category: category } })),
    fallback: false,
  }
}

interface Props {
  category: string
  blogs: PostTypes[]
}

function CategoriesIndex(props: Props) {
  const { blogs, category } = props
  const capitalizedCategory = startCase(category.replaceAll('-', ' '))

  return (
    <>
      <NextSeo
        title={`Blog | ${capitalizedCategory}`}
        description="Latest news from the Supabase team."
      />
      <DefaultLayout>
        <div className="container mx-auto px-8 py-16 sm:px-16 xl:px-20">
          <div className="text-foreground-lighter flex space-x-1">
            <h1 className="cursor-pointer">
              <Link href="/blog">Blog</Link>
              <span className="px-2">/</span>
              <span>{`${capitalizedCategory}`}</span>
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

export default CategoriesIndex
