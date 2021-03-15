// file: pages/blog/[slug].js
import React from 'react'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'
import { NextSeo } from 'next-seo'

import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'
import { generateReadingTime } from '~/lib/helpers'
import ReactMarkdown from 'react-markdown'
import authors from 'lib/authors.json'
import matter from 'gray-matter'
import renderToString from 'next-mdx-remote/render-to-string'
import hydrate from 'next-mdx-remote/hydrate'

import { IconFile, Space, Typography, Badge, Divider, Card } from '@supabase/ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import Quote from '~/components/Quote'

import blogStyles from './[slug].module.css'
import Link from 'next/link'

// import all components used in blog articles here
// for instance, if you use a button, you must add `Button` in the components object below.
const components = {
  CodeBlock,
  Quote,
  code: (props: any) => {
    return <CodeBlock {...props} />
  },
}

// plugins for next-mdx-remote
const gfm = require('remark-gfm')
const slug = require('rehype-slug')

// table of contents extractor
const toc = require('markdown-toc')

export async function getStaticPaths() {
  const paths = getAllPostSlugs()
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }: any) {
  const postContent = await getPostdata(params.slug)
  const { data, content } = matter(postContent)

  const mdxSource: any = await renderToString(content, {
    components,
    scope: data,
    mdxOptions: {
      remarkPlugins: [gfm],
      rehypePlugins: [slug],
    },
  })

  // console.log('tagsss', mdxSource.scope.tags)

  const relatedPosts = getSortedPosts(5, mdxSource.scope.tags)

  const allPosts = getSortedPosts()

  // console.log(lastPost.indexOf())

  const currentIndex = allPosts
    .map(function (e) {
      return e.slug
    })
    .indexOf(params.slug)

  return {
    props: {
      prevPost: currentIndex === 0 ? null : allPosts[currentIndex - 1],
      nextPost: currentIndex === allPosts.length ? null : allPosts[currentIndex + 1],
      relatedPosts,
      blog: {
        slug: params.slug,
        content: mdxSource,
        ...data,
        toc: toc(content),
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
      <Link href={post.slug} as={post.slug}>
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
                  return <Badge key={`categroy-badge-${tag}`}>{tag}</Badge>
                })}
              </div>
            </Space>
          </Card>
        </div>
      </Link>
    )
  }

  return (
    <>
      <NextSeo
        title={props.blog.title}
        openGraph={{
          title: props.blog.title,
          description: 'Description of open graph article',
          url: `${basePath}/blog/${props.blog.slug}`,
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
              url: `${basePath}/images/blog/${
                props.blog.thumb ? props.blog.thumb : props.blog.image
              }`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-white dark:bg-dark-800 overflow-hidden py-12">
          <div className="container px-8 sm:px-16 xl:px-20 mt-16 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="py-12 grid grid-cols-12 gap-16">
                <div className="col-span-10">
                  <Link href={`/blog`} as={`/blog`}>
                    <div>
                      <Typography.Text type="secondary">
                        <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer">
                          View more posts
                        </span>
                      </Typography.Text>
                    </div>
                  </Link>
                  <Space className="my-4">
                    <Typography.Text>{props.blog.date}</Typography.Text>
                    <Typography.Text type="secondary">•</Typography.Text>
                    <Typography.Text>
                      {generateReadingTime(props.blog.content.renderedOutput)}
                    </Typography.Text>
                  </Space>
                  <Typography.Title>{props.blog.title}</Typography.Title>
                  {author && (
                    <div className="mt-6">
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
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container px-8 sm:px-16 xl:px-20 py-16 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="py-4 grid grid-cols-12 gap-16">
              <div className="col-span-8">
                {props.blog.thumb && (
                  <img
                    src={'/new/images/blog/' + props.blog.thumb}
                    className="object-cover -mt-32 mb-8 border dark:border-gray-600"
                    style={{ maxHeight: '520px', width: '100%' }}
                  />
                )}
                <article className={blogStyles['article']}>
                  <Typography>{content}</Typography>
                </article>
              </div>
              <div className="col-span-4">
                <Space direction="vertical" size={8}>
                  <Space>
                    {props.blog.tags.map((tag: string) => {
                      return <Badge key={`categroy-badge-${tag}`}>{tag}</Badge>
                    })}
                  </Space>
                  {props.blog.toc && (
                    <div>
                      <Typography.Title level={5}>Table of contents</Typography.Title>
                      <Typography>
                        <div className={blogStyles['toc']}>
                          <ReactMarkdown plugins={[gfm]}>{props.blog.toc.content}</ReactMarkdown>
                        </div>
                      </Typography>
                    </div>
                  )}
                  <div>
                    <Typography.Title className="mb-4" level={5}>
                      Related articles
                    </Typography.Title>
                    <Space direction="vertical">
                      {props.relatedPosts.map((post: any) => (
                        <Link href={`/blog/${post.slug}`} as={`/blog/${post.slug}`}>
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
            <div className="grid grid-cols-2 gap-8 py-8">
              <div>{props.prevPost && <NextCard post={props.prevPost} label="Last post" />}</div>
              <div>
                {props.nextPost && (
                  <NextCard post={props.nextPost} label="Next post" className="text-right" />
                )}
              </div>
            </div>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

export default BlogPostPage
