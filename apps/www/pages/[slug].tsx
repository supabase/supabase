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
import blogStyles from './[slug].module.css'
import LayoutComparison from '~/layouts/comparison'

// import all components used in blog articles here
// for instance, if you use a button, you must add `Button` in the components object below.
const components = {
  CodeBlock,
  Quote,
  Avatar,
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
  console.log('slug', slug)
  console.log('gfm', gfm)
  const paths = getAllPostSlugs('_comparison_landing_pages')
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }: any) {
  const filePath = `${params.slug}`
  const postContent = await getPostdata(filePath, '_comparison_landing_pages')
  const { data, content } = matter(postContent)

  const mdxSource: any = await renderToString(content, {
    components,
    scope: data,
    mdxOptions: {
      remarkPlugins: [gfm],
      rehypePlugins: [slug],
    },
  })

  const relatedPosts = getSortedPosts('_comparison_landing_pages', 5, mdxSource.scope.tags)

  const allPosts = getSortedPosts('_comparison_landing_pages')

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
      <Link href={`/blog/${post.url}`} as={`/blog/${post.url}`}>
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
        <p className="text-scale-1200">On this page</p>
        <div>
          <div className={[blogStyles['toc'], 'prose prose-toc'].join(' ')}>
            <ReactMarkdown plugins={[gfm]}>{props.blog.toc.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )

  return <LayoutComparison components={components} props={props} gfm={gfm} slug={slug} />
}

// function BlogPostPage() {
//   return <h1>blog post</h1>
// }

export default BlogPostPage
