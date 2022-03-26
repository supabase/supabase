import { Badge, Card, Divider, IconChevronLeft, IconFile, Space, Typography } from '@supabase/ui'
import matter from 'gray-matter'
import authors from 'lib/authors.json'
import hydrate from 'next-mdx-remote/hydrate'
import renderToString from 'next-mdx-remote/render-to-string'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import Image from 'next/image'
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

  const copyLink = () => {
    navigator.clipboard.writeText(`https://supabase.com/blog/${props.blog.slug}`)
  }

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
                              <div className="w-10">
                                <Image
                                  src={author.author_image_url}
                                  className="rounded-full border dark:border-dark"
                                  width="100%"
                                  height="100%"
                                  layout="responsive"
                                />
                              </div>
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
                    <div className="relative overflow-auto w-full h-96 mb-8 border dark:border-gray-600">
                      <Image
                        src={'/images/blog/' + props.blog.thumb}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  <article className={blogStyles['article']}>
                    <Typography>{content}</Typography>
                  </article>
                  <div className="text-gray-900 dark:text-white">Share with your friends</div>
                  <div className="flex space-x-4 mt-4">
                    <div>
                      <Link
                        href={`https://twitter.com/share?text=Checkout%20@supabase's%20new%20blog%20post%20%7C%20${props.blog.title}&url=https://supabase.com/blog/${props.blog.slug}`}
                      >
                        <a
                          target="_blank"
                          className="text-gray-300 hover:text-gray-400 dark:hover:text-gray-400"
                        >
                          <svg
                            height="26"
                            width="26"
                            viewBox="-89 -46.8 644 446.8"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                          >
                            <path
                              d="m154.729 400c185.669 0 287.205-153.876 287.205-287.312 0-4.37-.089-8.72-.286-13.052a205.304 205.304 0 0 0 50.352-52.29c-18.087 8.044-37.55 13.458-57.968 15.899 20.841-12.501 36.84-32.278 44.389-55.852a202.42 202.42 0 0 1 -64.098 24.511c-18.42-19.628-44.644-31.904-73.682-31.904-55.744 0-100.948 45.222-100.948 100.965 0 7.925.887 15.631 2.619 23.025-83.895-4.223-158.287-44.405-208.074-105.504a100.739 100.739 0 0 0 -13.668 50.754c0 35.034 17.82 65.961 44.92 84.055a100.172 100.172 0 0 1 -45.716-12.63c-.015.424-.015.837-.015 1.29 0 48.903 34.794 89.734 80.982 98.986a101.036 101.036 0 0 1 -26.617 3.553c-6.493 0-12.821-.639-18.971-1.82 12.851 40.122 50.115 69.319 94.296 70.135-34.549 27.089-78.07 43.224-125.371 43.224a204.9 204.9 0 0 1 -24.078-1.399c44.674 28.645 97.72 45.359 154.734 45.359"
                              fill-rule="nonzero"
                            />
                          </svg>
                        </a>
                      </Link>
                    </div>

                    <div>
                      <Link
                        href={`https://www.linkedin.com/shareArticle?url=https://supabase.com/blog/${props.blog.slug}&title=Checkout%20@supabase's%20new%20blog%20post%20%7C%20${props.blog.title}`}
                      >
                        <a
                          target="_blank"
                          className="text-gray-300 hover:text-gray-400 dark:hover:text-gray-400"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 5 1036 990"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                          >
                            <path d="M0 120c0-33.334 11.667-60.834 35-82.5C58.333 15.833 88.667 5 126 5c36.667 0 66.333 10.666 89 32 23.333 22 35 50.666 35 86 0 32-11.333 58.666-34 80-23.333 22-54 33-92 33h-1c-36.667 0-66.333-11-89-33S0 153.333 0 120zm13 875V327h222v668H13zm345 0h222V622c0-23.334 2.667-41.334 8-54 9.333-22.667 23.5-41.834 42.5-57.5 19-15.667 42.833-23.5 71.5-23.5 74.667 0 112 50.333 112 151v357h222V612c0-98.667-23.333-173.5-70-224.5S857.667 311 781 311c-86 0-153 37-201 111v2h-1l1-2v-95H358c1.333 21.333 2 87.666 2 199 0 111.333-.667 267.666-2 469z" />
                          </svg>
                        </a>
                      </Link>
                    </div>

                    <button
                      onClick={() => copyLink()}
                      className="text-gray-300 hover:text-gray-400 dark:hover:text-gray-400"
                    >
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </button>
                  </div>
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
