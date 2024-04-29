import matter from 'gray-matter'
import { NextSeo } from 'next-seo'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MDXRemote } from 'next-mdx-remote'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Badge, IconChevronLeft } from 'ui'

import authors from 'lib/authors.json'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { generateReadingTime, isNotNullOrUndefined } from '~/lib/helpers'

import BlogLinks from '~/components/LaunchWeek/7/BlogLinks'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import LWXSummary from '~/components/LaunchWeek/X/LWXSummary'
import ShareArticleActions from '~/components/Blog/ShareArticleActions'
import LW11Summary from '~/components/LaunchWeek/11/LW11Summary'

type Post = ReturnType<typeof getSortedPosts>[number]

type BlogData = {
  title: string
  description: string
  tags?: string[]
  date: string
  toc_depth?: number
  author: string
  image?: string
  thumb?: string
  youtubeHero?: string
  author_url?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  video?: string
}

type MatterReturn = {
  data: BlogData
  content: string
}

type Blog = {
  slug: string
  source: string
  content: any
  toc: any
}

type BlogPostPageProps = {
  prevPost: Post | null
  nextPost: Post | null
  relatedPosts: (Post & BlogData)[]
  blog: Blog & BlogData
}

type Params = {
  slug: string
}

// table of contents extractor
const toc = require('markdown-toc')

export async function getStaticPaths() {
  const paths = getAllPostSlugs('_blog')
  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<BlogPostPageProps, Params> = async ({ params }) => {
  if (params?.slug === undefined) {
    throw new Error('Missing slug for pages/blog/[slug].tsx')
  }

  const filePath = `${params.slug}`
  const postContent = await getPostdata(filePath, '_blog')
  const { data, content } = matter(postContent) as unknown as MatterReturn

  const mdxSource: any = await mdxSerialize(content)

  const relatedPosts = getSortedPosts({
    directory: '_blog',
    limit: 5,
    tags: mdxSource.scope.tags,
    currentPostSlug: filePath,
  }) as unknown as (BlogData & Post)[]

  const allPosts = getSortedPosts({ directory: '_blog' })

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
        source: content,
        ...data,
        content: mdxSource,
        toc: toc(content, { maxdepth: data.toc_depth ? data.toc_depth : 2 }),
      },
    },
  }
}

function BlogPostPage(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const content = props.blog.content
  const authorArray = props.blog.author.split(',')
  const isLaunchWeek7 = props.blog.launchweek === 7
  const isLaunchWeekX = props.blog.launchweek?.toString().toLocaleLowerCase() === 'x'
  const isGAWeek = props.blog.launchweek?.toString().toLocaleLowerCase() === '11'

  const author = authorArray
    .map((authorId) => {
      return authors.find((author) => author.author_id === authorId)
    })
    .filter(isNotNullOrUndefined)

  const authorUrls = author.map((author) => author?.author_url).filter(isNotNullOrUndefined)

  const { basePath } = useRouter()

  const NextCard = (props: any) => {
    const { post, label, className } = props

    return (
      <Link href={`${post.path}`} as={`${post.path}`}>
        <div className={className}>
          <div className="hover:bg-control cursor-pointer rounded border p-6 transition">
            <div className="space-y-4">
              <div>
                <p className="text-foreground-lighter text-sm">{label}</p>
              </div>
              <div>
                <h4 className="text-foreground text-lg">{post.title}</h4>
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
        <div className="flex flex-wrap gap-2">
          {props.blog.tags?.map((tag: string) => {
            return (
              <Link href={`/blog/tags/${tag}`} key={`category-badge-${tag}`}>
                <Badge>{tag}</Badge>
              </Link>
            )
          })}
        </div>
      </div>
      <div>
        <div>
          <p className="text-foreground mb-4">On this page</p>
          <div className="prose-toc">
            <ReactMarkdown>{props.blog.toc.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )

  const meta = {
    title: props.blog.meta_title ?? props.blog.title,
    description: props.blog.meta_description ?? props.blog.description,
    url: `https://supabase.com/blog/${props.blog.slug}`,
  }

  return (
    <>
      <NextSeo
        title={meta.title}
        description={meta.description}
        openGraph={{
          title: meta.title,
          description: meta.description,
          url: meta.url,
          type: 'article',
          videos: props.blog.video
            ? [
                {
                  // youtube based video meta
                  url: props.blog.video,
                  type: 'application/x-shockwave-flash',
                  width: 640,
                  height: 385,
                },
              ]
            : undefined,
          article: {
            //
            // to do: add expiration and modified dates
            // https://github.com/garmeeh/next-seo#article
            publishedTime: props.blog.date,
            //
            // to do: author urls should be internal in future
            // currently we have external links to github profiles
            authors: authorUrls,
            tags: props.blog.tags?.map((cat: string) => {
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
            container mx-auto px-4 py-4 md:py-8 xl:py-10 sm:px-16
            xl:px-20
          "
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="hidden col-span-12 xl:block lg:col-span-2">
              {/* Back button */}
              <Link
                href="/blog"
                className="text-foreground-lighter hover:text-foreground flex cursor-pointer items-center text-sm transition"
              >
                <IconChevronLeft style={{ padding: 0 }} />
                Back
              </Link>
            </div>
            <div className="col-span-12 lg:col-span-12 xl:col-span-10">
              {/* Title and description */}
              <div className="mb-6 lg:mb-10 max-w-5xl space-y-8">
                <div className="space-y-4">
                  <Link href="/blog" className="text-brand hidden lg:inline">
                    Blog
                  </Link>
                  <h1 className="text-2xl sm:text-4xl">{props.blog.title}</h1>
                  <div className="text-light flex space-x-3 text-sm">
                    <p>{props.blog.date}</p>
                    <p>•</p>
                    <p>{generateReadingTime(props.blog.source)}</p>
                  </div>
                  <div className="hidden lg:flex justify-between">
                    <div className="flex-1 flex flex-col gap-3 pt-2 md:flex-row md:gap-0 lg:gap-3">
                      {author.map((author: any, i: number) => {
                        return (
                          <div className="mr-4 w-max" key={i}>
                            <Link
                              href={author.author_url}
                              target="_blank"
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {author.author_image_url && (
                                  <div className="w-10">
                                    <Image
                                      src={author.author_image_url}
                                      className="border-default rounded-full border w-full aspect-square object-cover"
                                      alt={`${author.author} avatar`}
                                      width={40}
                                      height={40}
                                    />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-foreground mb-0 text-sm">
                                    {author.author}
                                  </span>
                                  <span className="text-foreground-lighter mb-0 text-xs">
                                    {author.position}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-12 lg:gap-16 xl:gap-8">
                {/* Content */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-7 overflow-x-hidden">
                  <article>
                    <div className={['prose prose-docs'].join(' ')}>
                      {props.blog.youtubeHero ? (
                        <iframe
                          className="w-full"
                          width="700"
                          height="350"
                          src={props.blog.youtubeHero}
                          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen={true}
                        />
                      ) : (
                        props.blog.thumb && (
                          <div className="hidden md:block relative mb-8 h-96 w-full overflow-auto rounded-lg border">
                            <Image
                              src={'/images/blog/' + props.blog.thumb}
                              alt={props.blog.title}
                              fill
                              quality={100}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover m-0"
                            />
                          </div>
                        )
                      )}
                      <MDXRemote {...content} components={mdxComponents('blog')} />
                    </div>
                  </article>
                  {isLaunchWeek7 && <BlogLinks />}
                  {isLaunchWeekX && <LWXSummary />}
                  {isGAWeek && <LW11Summary />}
                  <div className="block lg:hidden py-8">
                    <div className="text-foreground-lighter text-sm">Share this article</div>
                    <ShareArticleActions title={props.blog.title} slug={props.blog.slug} />
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
                <div className="relative col-span-12 space-y-8 lg:col-span-5 xl:col-span-3 xl:col-start-9">
                  <div className="space-y-6">
                    <div className="hidden lg:block">{toc}</div>
                    <div className="hidden lg:block">
                      <div className="text-foreground text-sm">Share this article</div>
                      <ShareArticleActions title={props.blog.title} slug={props.blog.slug} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default BlogPostPage
