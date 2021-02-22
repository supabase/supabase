import DefaultLayout from '~/components/Layouts/Default'
import Link from 'next/link'
import { Typography, Badge, Space, Button } from '@supabase/ui'
import authors from 'lib/authors.json'
import { getSortedPosts, getAllCategories } from '~/lib/posts'
import { useEffect, useState } from 'react'

export async function getStaticProps() {
  const allPostsData = getSortedPosts()
  const categories = getAllCategories()

  console.log(categories)
  return {
    props: {
      blogs: allPostsData,
      categories,
    },
  }
}

function Blog(props: any) {
  const [category, setCategory] = useState('')
  const [blogs, setBlogs] = useState(props.blogs)

  useEffect(() => {
    // Update the document title using the browser API
    setBlogs(
      category
        ? props.blogs.filter((post: any) => {
            const found = post.tags.includes(category)
            return found
          })
        : blogs
    )
  }, [category])

  return (
    <DefaultLayout>
      <div className="bg-white dark:bg-dark-700 overflow-hidden py-12">
        <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
          <div className="mx-auto max-w-7xl">
            <Typography.Title>Blog</Typography.Title>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-dark-800 overflow-hidden py-12">
        <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-16">
          <div className="mx-auto max-w-7xl">
            <Typography.Title level={2}>Latests posts</Typography.Title>
            <div className="mt-5 max-w-lg mx-auto grid gap-16 lg:grid-cols-2 lg:max-w-none">
              {/* <ul> */}
              {props.blogs.slice(0, 2).map((blog: any, idx: any) => {
                return FeaturedThumb(blog)
              })}
              {/* </ul> */}
            </div>
          </div>
        </div>
        <div className="container mx-auto px-8 sm:px-16 xl:px-20 mt-32">
          <div className=" mx-auto max-w-7xl">
            <div className="grid grid-cols-12">
              <div className="col-span-8">
                <Typography.Title level={2}>More posts from the team</Typography.Title>
              </div>
              {/* <Select className="sbui-border-fix col-span-4">
                <Select.Option value="" selected>
                  Choose a category
                </Select.Option>
                <Select.Option value="case-study">Case study</Select.Option>
                <Select.Option value="supabase">Supabase</Select.Option>
              </Select> */}
            </div>
            <Space className="mt-6">
              {props.categories.map((categoryId: string) => (
                <Button
                  type={category === categoryId ? 'primary' : 'outline'}
                  key={categoryId}
                  onClick={() => setCategory(categoryId)}
                >
                  {categoryId}
                </Button>
              ))}
            </Space>
            <div className="mt-12 max-w-lg mx-auto grid lg:grid-cols-1 lg:max-w-none">
              {/* <ul> */}
              {blogs.map((blog: any, idx: any) => {
                return BlogListItem(blog)
              })}
              {/* </ul> */}
            </div>{' '}
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

function FeaturedThumb(blog: any) {
  // @ts-ignore
  const author = blog.author ? authors[blog.author] : authors['supabase']

  return (
    <div key={blog.id} className="my-6">
      <Link href={`/blog/${blog.slug}`} as={`/blog/${blog.slug}`}>
        <div>
          <img
            className="h-96 w-full object-cover"
            src={`/new/images/blog/` + (blog.thumb ? blog.thumb : blog.image)}
          />
          <Space direction="vertical" size={5} className="mt-4">
            <div>
              <Space className="mb-2">
                <Typography.Text type="secondary">{blog.date}</Typography.Text>
                <Typography.Text type="secondary">•</Typography.Text>
                <Typography.Text type="secondary">5 min read</Typography.Text>
              </Space>

              <Space direction="vertical" size={3}>
                <Typography.Title level={3} className="">
                  {blog.title}
                </Typography.Title>

                <Space className="block">
                  {blog.tags && blog.tags.map((tag: string) => <Badge dot={false}>{tag}</Badge>)}
                </Space>
              </Space>
            </div>

            {author && (
              <div>
                <Space size={4}>
                  {author.author_image_url && (
                    <img src={author.author_image_url} className="rounded-full w-10" />
                  )}
                  <Space direction="vertical" size={0}>
                    <Typography.Text>{author.author}</Typography.Text>
                    <Typography.Text type="secondary" small>
                      {author.position}
                    </Typography.Text>
                  </Space>
                </Space>
              </div>
            )}
          </Space>
        </div>
      </Link>
    </div>
  )
}

function BlogListItem(blog: any) {
  // @ts-ignore
  const author = blog.author ? authors[blog.author] : authors['supabase']

  // console.log(blog.content.substring(0, 120))
  return (
    <div key={blog.id} className="py-4 border-b border-gray-100 dark:border-gray-600 mb-8">
      <div className=" mx-auto max-w-7xl">
        <Link href={`/blog/${blog.slug}`} as={`/blog/${blog.slug}`}>
          <div>
            <Space direction="vertical" size={5} className="">
              <div>
                <Space className="mb-2">
                  <Typography.Text type="secondary">{blog.date}</Typography.Text>
                  <Typography.Text type="secondary">•</Typography.Text>
                  <Typography.Text type="secondary">5 min read</Typography.Text>
                </Space>

                <Space direction="vertical" size={3}>
                  <Typography.Title level={3} className="">
                    {blog.title}
                  </Typography.Title>

                  <Space className="block">
                    {blog.tags && blog.tags.map((tag: string) => <Badge dot={false}>{tag}</Badge>)}
                  </Space>
                </Space>
              </div>

              {author && (
                <div>
                  <Space size={4}>
                    {author.author_image_url && (
                      <img src={author.author_image_url} className="rounded-full w-10" />
                    )}
                    <Space direction="vertical" size={0}>
                      <Typography.Text>{author.author}</Typography.Text>
                      <Typography.Text type="secondary" small>
                        {author.position}
                      </Typography.Text>
                    </Space>
                  </Space>
                </div>
              )}
              {/* <Typography>
                <ReactMarkdown>{blog.content.substring(0, 210) + '...'}</ReactMarkdown>
              </Typography>
              <Typography.Link>Read more</Typography.Link> */}
            </Space>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default Blog
