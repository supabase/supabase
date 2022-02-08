import { Badge, Card, Divider, IconChevronLeft, IconFile, Space, Typography } from '@supabase/ui'
import matter from 'gray-matter'
import authors from 'lib/authors.json'
import hydrate from 'next-mdx-remote/hydrate'
import renderToString from 'next-mdx-remote/render-to-string'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import Quote from '~/components/Quote'
import ImageGrid from '~/components/ImageGrid'
import { generateReadingTime } from '~/lib/helpers'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'
import blogStyles from './[slug].module.css'

// import all components used in blog articles here
// for instance, if you use a button, you must add `Button` in the components object below.
const components = {
  CodeBlock,
  Quote,
  code: (props: any) => {
    return <CodeBlock {...props} />
  },
  ImageGrid,
}

// plugins for next-mdx-remote
const gfm = require('remark-gfm')
const slug = require('rehype-slug')

// table of contents extractor
const toc = require('markdown-toc')

export async function getStaticPaths() {
  const paths = getAllPostSlugs('_blog')
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }: any) {
  const filePath = `${params.year}-${params.month}-${params.day}-${params.slug}`
  const postContent = await getPostdata(filePath, '_blog')
  const { data, content } = matter(postContent)

  const mdxSource: any = await renderToString(content, {
    components,
    scope: data,
    mdxOptions: {
      remarkPlugins: [gfm],
      rehypePlugins: [slug],
    },
  })

  const relatedPosts = getSortedPosts('_blog', 5, mdxSource.scope.tags)

  const allPosts = getSortedPosts('_blog')

  const currentIndex = allPosts
    .map(function (e) {
      return e.slug
    })
    .indexOf(filePath)

  const nextPost = allPosts[currentIndex + 1]
  const prevPost = allPosts[currentIndex - 1]

  return {
    props: {
      prevPost: currentIndex === 0 ? null : prevPost ? prevPost : null,
      nextPost: currentIndex === allPosts.length ? null : nextPost ? nextPost : null,
      relatedPosts,
      blog: {
        slug: `${params.year}/${params.month}/${params.day}/${params.slug}`,
        content: mdxSource,
        ...data,
        toc: toc(content, { maxdepth: data.toc_depth ? data.toc_depth : 2 }),
      },
    },
  }
}

function BlogPostPage(props: any) {
  // @ts-ignore
  const author = props.blog.author ? authors[props.blog.author] : authors['supabase']
  const content = hydrate(props.blog.content, { components })

  const { basePath } = useRouter()

  const NextCard = (props: any) => {
    const { post, label, className } = props
    return (
      <Link href={`/blog/${post.url}`} as={`/blog/${post.url}`}>
        <div className={className}>
          <Card className="cursor-pointer" hoverable>
            <Space direction="vertical">
              <div>
                <Typography.Text>{label}</Typography.Text>
              </div>
              <div>
                <Typography.Title level={4}>{post.title}</Typography.Title>
                <Typography.Text>{post.date}</Typography.Text>
              </div>
              <div>
                {post.tags.map((tag: string) => {
                  return <Badge key={`category-badge-${tag}`}>{tag}</Badge>
                })}
              </div>
            </Space>
          </Card>
        </div>
      </Link>
    )
  }

  const toc = props.blog.toc && (
    <Space direction="vertical" size={8} className="py-8 lg:py-0">
      <div>
        <Space>
          {props.blog.tags.map((tag: string) => {
            return (
              <a href={`/blog/tags/${tag}`} key={`category-badge-${tag}`}>
                <Badge>{tag}</Badge>
              </a>
            )
          })}
        </Space>
      </div>
      <div>
        <Typography.Text type="secondary">Table of contents</Typography.Text>
        <Typography>
          <div className={blogStyles['toc']}>
            <ReactMarkdown plugins={[gfm]}>{props.blog.toc.content}</ReactMarkdown>
          </div>
        </Typography>
      </div>
    </Space>
  )

  return (
    <>
      <NextSeo
        title={props.blog.title}
        openGraph={{
          title: props.blog.title,
          description: props.blog.description,
          url: `https://supabase.com/blog/${props.blog.slug}`,
          type: 'article',
          article: {
            //
            // to do: add expiration and modified dates
            // https://github.com/garmeeh/next-seo#article
            publishedTime: props.blog.date,
            //
            // to do: author urls should be internal in future
            // currently we have external links to github profiles
            authors: [props.blog.author_url],
            tags: props.blog.tags.map((cat: string) => {
              return cat
            }),
          },
          images: [
            {
              url: `https://supabase.com${basePath}/images/blog/${
                props.blog.image ? props.blog.image : props.blog.thumb
              }`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div
          className="
          bg-white dark:bg-dark-800
            container px-8 sm:px-16 xl:px-20 mx-auto
            py-16
          "
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-2 mb-2">
              {/* Back button */}
              <Typography.Text type="secondary">
                <a
                  href={'/blog'}
                  className="hover:text-gray-900 dark:hover:text-white cursor-pointer flex items-center"
                >
                  <IconChevronLeft style={{ padding: 0 }} />
                  Back
                </a>
              </Typography.Text>
            </div>
            <div className="col-span-12 lg:col-span-12 xl:col-span-10">
              {/* Title and description */}
              <div className="mb-16 space-y-8 max-w-5xl">
                <div className="space-y-4">
                  <Typography.Text type="success">Blog post</Typography.Text>
                  <Typography.Title>{props.blog.title}</Typography.Title>
                  <div className="flex space-x-3">
                    <Typography.Text>{props.blog.date}</Typography.Text>
                    <Typography.Text type="secondary">•</Typography.Text>
                    <Typography.Text>
                      {generateReadingTime(props.blog.content.renderedOutput)}
                    </Typography.Text>
                  </div>
                  {author && (
                    <div className="mt-6 mb-8 lg:mb-0 w-max">
                      <Link href={author.author_url}>
                        <a className="cursor-pointer">
                          <Space size={4}>
                            {author.author_image_url && (
                              <img
                                src={author.author_image_url}
                                className="rounded-full w-10 border dark:border-dark"
                              />
                            )}
                            <Space direction="vertical" size={0}>
                              <Typography.Text>{author.author}</Typography.Text>
                              <Typography.Text type="secondary" small>
                                {author.position}
                              </Typography.Text>
                            </Space>
                          </Space>
                        </a>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-12 lg:gap-16 xl:gap-8">
                {/* Content */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-7">
                  {props.blog.thumb && (
                    <img
                      src={'/images/blog/' + props.blog.thumb}
                      className="object-cover mb-8 border dark:border-gray-600"
                      style={{ maxHeight: '520px' }}
                    />
                  )}
                  <article className={blogStyles['article']}>
                    <Typography>{content}</Typography>
                  </article>
                  <div className="grid lg:grid-cols-1 gap-8 py-8">
                    <div>
                      {props.prevPost && <NextCard post={props.prevPost} label="Last post" />}
                    </div>
                    <div>
                      {props.nextPost && (
                        <NextCard post={props.nextPost} label="Next post" className="text-right" />
                      )}
                    </div>
                  </div>
                </div>
                {/* Sidebar */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-3 xl:col-start-9 space-y-8">
                  <Space direction="vertical" size={8} className="lg:mb-16 lg:top-16 lg:sticky">
                    <div className="hidden lg:block">{toc}</div>
                    <div>
                      <div className="mb-4">
                        <Typography.Text type="secondary">Related articles</Typography.Text>
                      </div>
                      <Space direction="vertical">
                        {props.relatedPosts.map((post: any) => (
                          <Link href={`/blog/${post.url}`} as={`/blog/${post.url}`}>
                            <div>
                              <Typography.Text className="cursor-pointer">
                                <Space>
                                  <IconFile size={'small'} style={{ minWidth: '1.2rem' }} />
                                  <span className="hover:text-gray-900 dark:hover:text-white">
                                    {post.title}
                                  </span>
                                </Space>
                              </Typography.Text>
                              <Divider light className="mt-2" />
                            </div>
                          </Link>
                        ))}
                        <Link href={`/blog`} as={`/blog`}>
                          <div>
                            <Typography.Text type="secondary">
                              <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer">
                                View all posts
                              </span>
                            </Typography.Text>
                          </div>
                        </Link>
                      </Space>
                    </div>
                  </Space>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="container px-8 sm:px-16 xl:px-20 py-16 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="py-4 grid grid-cols-12 lg:gap-16">
              <div className="col-span-12 lg:col-span-8">
                {props.blog.thumb && (
                  <img
                    src={'/images/blog/' + props.blog.thumb}
                    className="object-cover -mt-32 mb-8 border dark:border-gray-600"
                    style={{ maxHeight: '520px', width: '100%' }}
                  />
                )}
                <div className="lg:hidden">{toc}</div>
                <article className={blogStyles['article']}>
                  <Typography>{content}</Typography>
                </article>
              </div>
              <div className="col-span-12 lg:col-span-4">
                <Space direction="vertical" size={8} className="lg:mb-16 lg:top-16 lg:sticky">
                  <div className="hidden lg:block">{toc}</div>
                  <div>
                    <Typography.Title className="mb-4" level={5}>
                      Related articles
                    </Typography.Title>
                    <Space direction="vertical">
                      {props.relatedPosts.map((post: any) => (
                        <Link href={`/blog/${post.url}`} as={`/blog/${post.url}`}>
                          <div>
                            <Typography.Text className="cursor-pointer">
                              <Space>
                                <IconFile size={'small'} style={{ minWidth: '1.2rem' }} />
                                <span className="hover:text-gray-900 dark:hover:text-white">
                                  {post.title}
                                </span>
                              </Space>
                            </Typography.Text>
                            <Divider light className="mt-2" />
                          </div>
                        </Link>
                      ))}
                      <Link href={`/blog`} as={`/blog`}>
                        <div>
                          <Typography.Text type="secondary">
                            <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer">
                              View all posts
                            </span>
                          </Typography.Text>
                        </div>
                      </Link>
                    </Space>
                  </div>
                </Space>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-8 py-8">
              <div>{props.prevPost && <NextCard post={props.prevPost} label="Last post" />}</div>
              <div>
                {props.nextPost && (
                  <NextCard post={props.nextPost} label="Next post" className="text-right" />
                )}
              </div>
            </div>
          </div>
        </div> */}

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

// function BlogPostPage() {
//   return <h1>blog post</h1>
// }

export default BlogPostPage
