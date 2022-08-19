import { Badge, Card, Divider, IconChevronLeft, IconFile, Space } from '@supabase/ui'
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
import Avatar from '~/components/Avatar'
import ImageGrid from '~/components/ImageGrid'
import { generateReadingTime } from '~/lib/helpers'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'

const ignoreClass = 'ignore-on-export'
// import all components used in blog articles here
// for instance, if you use a button, you must add `Button` in the components object below.
const components = {
  CodeBlock,
  Quote,
  Avatar,
  code: (props: any) => {
    if (props.className !== ignoreClass) {
      return <CodeBlock {...props} />
    } else {
      return <code {...props} />
    }
  },
  ImageGrid,
  img: (props: any) => {
    if (props.className !== ignoreClass) {
      return (
        <div
          className="
          next-image--dynamic-fill 
          to-scale-400  
          from-scale-500 rounded-lg
          border bg-gradient-to-r
        "
        >
          <Image {...props} className="next-image--dynamic-fill rounded-md border" layout="fill" />
        </div>
      )
    }
    return <img {...props} />
  },
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
  const filePath = `${params.slug}`
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
        slug: `${params.slug}`,
        content: mdxSource,
        ...data,
        toc: toc(content, { maxdepth: data.toc_depth ? data.toc_depth : 2 }),
      },
    },
  }
}

function BlogPostPage(props: any) {
  // @ts-ignore
  const content = hydrate(props.blog.content, { components })
  const authorArray = props.blog.author.split(',')

  const author = []
  for (let i = 0; i < authorArray.length; i++) {
    author.push(
      // @ts-ignore
      authors.find((authors: string) => {
        // @ts-ignore
        return authors.author_id === authorArray[i]
      })
    )
  }

  const { basePath } = useRouter()

  const NextCard = (props: any) => {
    const { post, label, className } = props

    return (
      <Link href={`${post.path}`} as={`${post.path}`}>
        <div className={className}>
          <div className="border-scale-500 hover:bg-scale-100 dark:hover:bg-scale-300 cursor-pointer rounded border p-6 transition">
            <div className="space-y-4">
              <div>
                <p className="text-scale-900 text-sm">{label}</p>
              </div>
              <div>
                <h4 className="text-scale-1200 text-lg">{post.title}</h4>
                <p className="small">{post.date}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const toc = props.blog.toc && (
    <div className="space-y-8 py-8 lg:py-0">
      <div>
        <div className="space-x-2">
          {props.blog.tags.map((tag: string) => {
            return (
              <a href={`/blog/tags/${tag}`} key={`category-badge-${tag}`}>
                <Badge>{tag}</Badge>
              </a>
            )
          })}
        </div>
      </div>
      <div>
        <div>
          <p className="text-scale-1200 mb-4">On this page</p>
          <div className="prose-toc">
            <ReactMarkdown plugins={[gfm]}>{props.blog.toc.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
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
              alt: `${props.blog.title} thumbnail`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div
          className="
            container mx-auto px-8 py-16 sm:px-16
            xl:px-20
          "
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 mb-2 lg:col-span-2">
              {/* Back button */}
              <p>
                <a
                  href={'/blog'}
                  className="text-scale-900 hover:text-scale-1200 flex cursor-pointer items-center text-sm transition"
                >
                  <IconChevronLeft style={{ padding: 0 }} />
                  Back
                </a>
              </p>
            </div>
            <div className="col-span-12 lg:col-span-12 xl:col-span-10">
              {/* Title and description */}
              <div className="mb-16 max-w-5xl space-y-8">
                <div className="space-y-4">
                  <p className="text-brand-900">Blog post</p>
                  <h1 className="h1">{props.blog.title}</h1>
                  <div className="text-scale-900 flex space-x-3 text-sm">
                    <p>{props.blog.date}</p>
                    <p>•</p>
                    <p>{generateReadingTime(props.blog.content.renderedOutput)}</p>
                  </div>
                  <div className="flex flex-col gap-3 pt-6 md:flex-row md:gap-0 lg:gap-3">
                    {author.map((author: any) => {
                      return (
                        <div className="mr-4 w-max">
                          <Link href={author.author_url}>
                            <a className="cursor-pointer">
                              <div className="flex items-center gap-3">
                                {author.author_image_url && (
                                  <div className="w-10">
                                    <Image
                                      src={author.author_image_url}
                                      className="dark:border-dark rounded-full border"
                                      width="100%"
                                      height="100%"
                                      layout="responsive"
                                    />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-scale-1200 mb-0 text-sm">
                                    {author.author}
                                  </span>
                                  <span className="text-scale-900 mb-0 text-xs">
                                    {author.position}
                                  </span>
                                </div>
                              </div>
                            </a>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-12 lg:gap-16 xl:gap-8">
                {/* Content */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-7">
                  {props.blog.thumb && (
                    <div className="relative mb-8 h-96 w-full overflow-auto rounded-lg border">
                      <Image
                        src={'/images/blog/' + props.blog.thumb}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  <article className={['prose prose-docs'].join(' ')}>{content}</article>
                  <div className="py-16">
                    <div className="text-scale-900 dark:text-scale-1000 text-sm">
                      Share this article
                    </div>
                    <div className="mt-4 flex items-center space-x-4">
                      <Link
                        passHref
                        href={`https://twitter.com/share?text=${props.blog.title}&url=https://supabase.com/blog/${props.blog.slug}`}
                      >
                        <a target="_blank" className="text-scale-900 hover:text-scale-1200">
                          <svg
                            height="26"
                            width="26"
                            viewBox="-89 -46.8 644 446.8"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                          >
                            <path
                              d="m154.729 400c185.669 0 287.205-153.876 287.205-287.312 0-4.37-.089-8.72-.286-13.052a205.304 205.304 0 0 0 50.352-52.29c-18.087 8.044-37.55 13.458-57.968 15.899 20.841-12.501 36.84-32.278 44.389-55.852a202.42 202.42 0 0 1 -64.098 24.511c-18.42-19.628-44.644-31.904-73.682-31.904-55.744 0-100.948 45.222-100.948 100.965 0 7.925.887 15.631 2.619 23.025-83.895-4.223-158.287-44.405-208.074-105.504a100.739 100.739 0 0 0 -13.668 50.754c0 35.034 17.82 65.961 44.92 84.055a100.172 100.172 0 0 1 -45.716-12.63c-.015.424-.015.837-.015 1.29 0 48.903 34.794 89.734 80.982 98.986a101.036 101.036 0 0 1 -26.617 3.553c-6.493 0-12.821-.639-18.971-1.82 12.851 40.122 50.115 69.319 94.296 70.135-34.549 27.089-78.07 43.224-125.371 43.224a204.9 204.9 0 0 1 -24.078-1.399c44.674 28.645 97.72 45.359 154.734 45.359"
                              fillRule="nonzero"
                            />
                          </svg>
                        </a>
                      </Link>

                      <Link
                        passHref
                        href={`https://www.linkedin.com/shareArticle?url=https://supabase.com/blog/${props.blog.slug}&title=${props.blog.title}`}
                      >
                        <a target="_blank" className="text-scale-900 hover:text-scale-1200">
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
                  </div>
                  <div className="grid gap-8 py-8 lg:grid-cols-1">
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
                <div className="col-span-12 space-y-8 lg:col-span-5 xl:col-span-3 xl:col-start-9">
                  <div className="space-y-8 lg:sticky lg:top-16 lg:mb-16">
                    <div className="hidden lg:block">{toc}</div>
                    <div>
                      <div className="mb-4">
                        <p className="text-scale-1200 text-sm">Related articles</p>
                      </div>
                      <div className="space-y-3">
                        {props.relatedPosts.map((post: any) => (
                          <Link href={`${post.path}`} as={`${post.path}`}>
                            <div>
                              <p className="cursor-pointer">
                                <div className="flex gap-2">
                                  <div className="text-scale-900">
                                    <IconFile size={'small'} style={{ minWidth: '1.2rem' }} />
                                  </div>
                                  <span className="text-scale-1100 hover:text-gray-1200 text-sm">
                                    {post.title}
                                  </span>
                                </div>
                              </p>
                              <Divider light className="mt-2" />
                            </div>
                          </Link>
                        ))}
                        <div className="mt-2">
                          <Link href={`/blog`} passHref>
                            <a className="text-scale-1100 hover:text-scale-1200 cursor-pointer text-sm">
                              View all posts
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    <h5 className="mb-4">
                      Related articles
                    </h5>
                    <Space direction="vertical">
                      {props.relatedPosts.map((post: any) => (
                        <Link href={`${post.path}`} as={`${post.path}`}>
                          <div>
                            <p className="cursor-pointer">
                              <Space>
                                <IconFile size={'small'} style={{ minWidth: '1.2rem' }} />
                                <span className="hover:text-gray-900 dark:hover:text-white">
                                  {post.title}
                                </span>
                              </Space>
                            </p>
                            <Divider light className="mt-2" />
                          </div>
                        </Link>
                      ))}
                      <Link href={`/blog`} as={`/blog`}>
                        <div>
                          <p>
                            <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer">
                              View all posts
                            </span>
                          </p>
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
