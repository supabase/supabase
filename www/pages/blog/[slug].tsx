// file: pages/blog/[slug].js
import React from 'react'
import DefaultLayout from '~/components/Layouts/Default'
import { NextSeo } from 'next-seo'

import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'
import { generateReadingTime } from '~/lib/helpers'
import ReactMarkdown from 'react-markdown'
import authors from 'lib/authors.json'
import matter from 'gray-matter'
import renderToString from 'next-mdx-remote/render-to-string'
import hydrate from 'next-mdx-remote/hydrate'

import { IconFile, IconLink, Space, Typography, Badge } from '@supabase/ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

import blogStyles from './[slug].module.css'

// import all components used in blog articles here
// for instance, if you use a button, you must add `Button` in the components object below.
const components = { CodeBlock }

// plugins for next-mdx-remote
const gfm = require('remark-gfm')
const slug = require('rehype-slug')

// table of contents extractor
const toc = require('markdown-toc')

function BlogPostPage(props: any) {
  // @ts-ignore
  const author = props.blog.author ? authors[props.blog.author] : authors['supabase']
  const content = hydrate(props.blog.content, { components })

  return (
    <>
      <NextSeo
        title={props.blog.title}
        openGraph={{
          title: props.blog.title,
          description: 'Description of open graph article',
          url: `https://supabase.io/blog/${props.blog.slug}`,
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
              url: `https://supabase.io/new/images/blog/${
                props.blog.thumb ? props.blog.thumb : props.blog.image
              }`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-white dark:bg-dark-700 overflow-hidden py-12">
          <div className="container px-8 sm:px-16 xl:px-20 mt-16 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="py-12 grid grid-cols-12 gap-16">
                <div className="col-span-10">
                  <Space className="mb-4">
                    <Typography.Text type="secondary">{props.blog.date}</Typography.Text>
                    <Typography.Text type="secondary">•</Typography.Text>
                    <Typography.Text type="secondary">
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
        <div className="container px-8 sm:px-16 xl:px-20 mt-16 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="py-4 grid grid-cols-12 gap-16">
              <div className="col-span-8">
                {props.blog.thumb && (
                  <img
                    src={'/new/images/blog/' + props.blog.thumb}
                    className="object-cover -mt-32 mb-8"
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
                  <div>
                    <Typography.Title level={5}>Table of contents</Typography.Title>
                    <Typography>
                      <div className={blogStyles['toc']}>
                        <ReactMarkdown plugins={[gfm]}>{props.blog.toc.content}</ReactMarkdown>
                      </div>
                    </Typography>
                  </div>
                  <div>
                    <Typography.Title className="mb-4" level={5}>
                      Related articles
                    </Typography.Title>
                    <Space direction="vertical">
                      {props.relatedPosts.map((post: any) => (
                        <Typography.Text>
                          <Space>
                            <IconFile size={'small'} style={{ minWidth: '1.2rem' }} />
                            <span>{post.title}</span>
                          </Space>
                        </Typography.Text>
                      ))}
                    </Space>
                  </div>
                </Space>
              </div>
            </div>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

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

  const relatedPosts = getSortedPosts(5, mdxSource.tags)

  return {
    props: {
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

export default BlogPostPage
