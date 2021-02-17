import DefaultLayout from '~/components/Layouts/Default'
import Link from 'next/link'
import { Typography, Card, Badge, Space } from '@supabase/ui'
import authors from 'lib/authors.json'

// function Blog(props: any) {
//   return (
//     <DefaultLayout>
//       <h1>Blog</h1>
//     </DefaultLayout>
//   )
// }

function Blog(props: any) {
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
            <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-2 lg:max-w-none">
              {/* <ul> */}
              {props.blogs.map((blog: any, idx: any) => {
                // @ts-ignore
                const author = authors[blog.author]
                return (
                  <div key={blog.id} className="my-6">
                    <Link href={`/blog/${blog.slug}`}>
                      <div>
                        <img
                          className="h-96 w-full object-cover"
                          src="https://images.unsplash.com/photo-1611549488883-9ff99c099b68?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=934&q=80"
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
                                {blog.tags &&
                                  blog.tags.map((tag: string) => <Badge dot={false}>{tag}</Badge>)}
                              </Space>
                            </Space>
                          </div>

                          {author && (
                            <div>
                              <Space size={4}>
                                {author.author_image_url && (
                                  <img
                                    src={author.author_image_url}
                                    className="rounded-full w-10"
                                  />
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
              })}
              {/* </ul> */}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

// This function gets called at build time on server-side.
export async function getStaticProps() {
  const fs = require('fs')
  const matter = require('gray-matter')
  const { v4: uuid } = require('uuid')

  const files = fs.readdirSync(`${process.cwd()}/_blog`, 'utf-8')

  const blogs = files
    .filter((fn: any) => fn.endsWith('.md'))
    .map((fn: any) => {
      const path = `${process.cwd()}/_blog/${fn}`
      const rawContent = fs.readFileSync(path, {
        encoding: 'utf-8',
      })
      const { data } = matter(rawContent)

      return { ...data, id: uuid() }
    })

  // By returning { props: blogs }, the IndexPage component
  // will receive `blogs` as a prop at build time
  return {
    props: { blogs },
  }
}

export default Blog
