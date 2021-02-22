// file: pages/blog/[slug].js
import React from 'react'
import { IconFile, IconLink, Space, Typography } from '@supabase/ui'
import ReactMarkdown from 'react-markdown'
import DefaultLayout from '~/components/Layouts/Default'
import authors from 'lib/authors.json'
import blogStyles from './[slug].module.css'

import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'

import matter from 'gray-matter'

import renderToString from 'next-mdx-remote/render-to-string'
import hydrate from 'next-mdx-remote/hydrate'
import Badge from '~/components/Badge'

const components = { CodeBlock }

const gfm = require('remark-gfm')
const toc = require('markdown-toc')
const slug = require('rehype-slug')

function BlogPostPage(props: any) {
  // @ts-ignore
  const author = props.blog.author ? authors[props.blog.author] : authors['supabase']
  const content = hydrate(props.blog.content, { components })

  return (
    <DefaultLayout>
      <div className="bg-white dark:bg-dark-700 overflow-hidden py-12">
        <div className="container px-8 sm:px-16 xl:px-20 mt-16 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="py-12 grid grid-cols-12 gap-16">
              <div className="col-span-10">
                <Space className="mb-4">
                  <Typography.Text type="secondary">{props.blog.date}</Typography.Text>
                  <Typography.Text type="secondary">•</Typography.Text>
                  <Typography.Text type="secondary">5 min read</Typography.Text>
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
              <Typography>{content}</Typography>
            </div>
            <div className="col-span-4">
              <Space direction="vertical" size={8}>
                <Space>
                  {props.blog.tags.map((tag: string) => {
                    return <Badge>{tag}</Badge>
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
        content: mdxSource,
        ...data,
        toc: toc(content),
      },
    },
  }
}

export default BlogPostPage
