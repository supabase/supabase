import {
  Badge,
  Card,
  Divider,
  IconFile,
  Space,
  Typography,
  Button,
  IconChevronRight,
  IconChevronLeft,
  IconGlobe,
  IconLink,
  IconExternalLink,
} from '@supabase/ui'
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
import Image from 'next/image'

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
  const paths = getAllPostSlugs('_case-studies')
  console.log('paths', paths)
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }: any) {
  console.log('params', params)

  const filePath = `${params.slug}`
  const postContent = await getPostdata(filePath, '_case-studies')
  const { data, content } = matter(postContent)

  const mdxSource: any = await renderToString(content, {
    components,
    scope: data,
    mdxOptions: {
      remarkPlugins: [gfm],
      rehypePlugins: [slug],
    },
  })

  const relatedPosts = getSortedPosts('_case-studies', 5, mdxSource.scope.tags)

  const allPosts = getSortedPosts('_case-studies')

  const currentIndex = allPosts
    .map(function (e) {
      return e.slug
    })
    .indexOf(filePath)

  const nextPost = allPosts[currentIndex + 1]
  const prevPost = allPosts[currentIndex - 1]

  const payload = {
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

  console.log(payload)
  return payload
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
          description: props.blog.description,
          url: `https://supabase.io/blog/${props.blog.slug}`,
          type: 'article',
          article: {
            //
            // to do: add expiration and modified dates
            // https://github.com/garmeeh/next-seo#article
            publishedTime: props.blog.date,
          },
          images: [
            {
              url: `https://supabase.io${basePath}/images/blog/${
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
            <div className="col-span-12 lg:col-span-2">
              {/* Back button */}
              <Typography.Text type="secondary">
                <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer flex items-center">
                  <IconChevronLeft />
                  Back
                </span>
              </Typography.Text>
            </div>
            <div className="col-span-12 lg:col-span-10">
              {/* Title and description */}
              <div className="mb-16">
                <Typography.Text type="success">Case study</Typography.Text>
                <Typography.Title>{props.blog.title}</Typography.Title>
              </div>
              {/* Quote can go here */}
              <div className="grid grid-cols-12 gap-8">
                {/* Content */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-6">
                  <article className={blogStyles['article']}>
                    <Typography>{content}</Typography>
                  </article>
                </div>
                {/* Sidebar */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-3 xl:col-start-8 space-y-8">
                  {/* Logo */}
                  <div className={`relative h-16 w-32`}>
                    <Image
                      layout="fill"
                      src={`${props.blog.logo}`}
                      alt={`${props.blog.title} logo`}
                      objectFit="scale-down"
                      // objectPosition="center"
                      className="
                      bg-no-repeat
                      
                      dark:filter 
                      dark:contrast-0
                      dark:brightness-200
                    "
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Typography.Text type="secondary">About</Typography.Text>
                    <Typography.Text>{props.blog.about}</Typography.Text>
                    <Typography.Text className="flex items-center space-x-1 transition-opacity cursor-pointer opacity-50 hover:opacity-100">
                      <span>{props.blog.company_url}</span>
                      <IconExternalLink size={14} />
                    </Typography.Text>
                  </div>
                  {props.blog.misc.map((x: any) => {
                    return (
                      <div className="flex flex-col space-y-2">
                        <Typography.Text type="secondary">{x.label}</Typography.Text>
                        <Typography.Text>{x.text}</Typography.Text>
                      </div>
                    )
                  })}
                  <div className="space-y-2">
                    {props.blog.stats.map((x: any) => {
                      return (
                        <div className="flex space-x-3">
                          <div className="h-8 w-0.5 bg-brand-600 mt-0.5"></div>
                          <div className="flex flex-col">
                            <Typography.Text>
                              <span className="text-3xl font-semibold leading-none">{x.stat}</span>
                            </Typography.Text>
                            <Typography.Text type="secondary">{x.label}</Typography.Text>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Typography.Text type="secondary">Ready to get started?</Typography.Text>
                    <Button type="default" iconRight={<IconChevronRight />}>
                      Contact sales
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div>{props.prevPost && <NextCard post={props.prevPost} label="Last post" />}</div>
            <div>
              {props.nextPost && (
                <NextCard post={props.nextPost} label="Next post" className="text-right" />
              )}
            </div>
          </div>
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

// function BlogPostPage() {
//   return <h1>blog post</h1>
// }

export default BlogPostPage
