import { ChevronLeftIcon } from '@heroicons/react/outline'
import {
  Badge,
  Button,
  Card,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  Space,
  Typography,
} from '@supabase/ui'
import matter from 'gray-matter'
import authors from 'lib/authors.json'
import hydrate from 'next-mdx-remote/hydrate'
import renderToString from 'next-mdx-remote/render-to-string'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import CTABanner from '~/components/CTABanner'
import ImageGrid from '~/components/ImageGrid'
import DefaultLayout from '~/components/Layouts/Default'
import Quote from '~/components/Quote'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'

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
          <div className="bg-scale-100 hover:bg-scale-200 dark:bg-scale-200 dark:hover:bg-scale-300 flex cursor-pointer items-center justify-center rounded-lg border p-3 drop-shadow-none transition-all hover:drop-shadow-lg ">
            <div className="relative flex h-40 w-40">
              <Image
                layout="fill"
                src={`${post.logo}`}
                alt={`${post.title} logo`}
                objectFit="scale-down"
                objectPosition="centre"
                className="
                      bg-no-repeat
                      dark:brightness-200 
                      dark:contrast-0
                      dark:filter
                    "
              />
            </div>
          </div>
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
          dark:bg-scale-200 bg-scale-200
            container mx-auto px-8 py-16 sm:px-16
            xl:px-20
          "
        >
          <div className="grid grid-cols-12 gap-8 xl:gap-16">
            <div className="col-span-12 flex flex-col gap-8 lg:col-span-10 xl:col-span-8">
              <p className="text-brand-900 mb-2 mt-0">
                Case Studies / <a>{props.blog.name}</a>
              </p>
              <h1 className="text-scale-1200 text-2xl font-semibold xl:text-5xl">
                {props.blog.title}
              </h1>
              <h2 className="text-scale-1200 text-xl xl:text-2xl">{props.blog.description}</h2>
            </div>
            {/* Back button */}
            {/* <div className="col-span-12 xl:col-span-2">
              <button className="text-scale-900 hover:text-scale-1200 flex cursor-pointer items-center gap-1 text-sm transition">
                <ChevronLeftIcon width={12} />
                All case studies
              </button>
            </div> */}
            <div className="col-span-12 xl:col-span-11">
              {/* Title and description */}
              {/* Quote can go here */}

              {/* Content */}
              <article className="prose col-span-12 max-w-none">
                {/* <div className="">
                  <p className="text-brand-900 mb-2 mt-0">Case study</p>
                  <h1 className="text-scale-1200 text-5xl lg:mb-0">{props.blog.title}</h1>
                </div> */}
                <div className="xl:gap-21 grid max-w-none grid-cols-12 lg:gap-16">
                  <div className="col-span-12 lg:col-span-5 lg:block xl:col-span-4">
                    <div className="space-y-8 lg:sticky lg:top-24 lg:mb-24">
                      {/* Logo */}
                      <div className={`relative h-16 w-32`}>
                        <p className="flex flex-row ">
                          <Image
                            layout="fill"
                            src={`${props.blog.logo}`}
                            alt={`${props.blog.title} logo`}
                            objectFit="scale-down"
                            objectPosition="left"
                            className="
                      bg-no-repeat
                      
                      dark:brightness-200 
                      dark:contrast-0
                      dark:filter
                    "
                          />
                        </p>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <span className="text-scale-900">About</span>
                        <p>{props.blog.about}</p>
                        <span className="not-prose ">
                          <a
                            href={props.blog.company_url}
                            className=" flex cursor-pointer items-center space-x-1 opacity-50 transition-opacity hover:opacity-100"
                          >
                            <span>{props.blog.company_url}</span>
                            <IconExternalLink size={14} />
                          </a>
                        </span>
                      </div>
                      {props.blog.misc.map((x: any) => {
                        return (
                          <div className="flex flex-col gap-0">
                            <span className="text-scale-900">{x.label}</span>
                            <span className="text-scale-1100">{x.text}</span>
                          </div>
                        )
                      })}
                      <div className="flex flex-col gap-8">
                        {props.blog.stats.map((x: any) => {
                          return (
                            <div className="flex space-x-3">
                              <div className="bg-brand-900 mt-0.5 h-8 w-0.5"></div>
                              <div className="flex flex-col gap-2">
                                <span className="text-scale-1200 text-2xl leading-none">
                                  {x.stat}
                                </span>
                                <span>{x.label}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="">
                        <p>Ready to get started?</p>
                        <div>
                          <Button type="default" iconRight={<IconChevronRight />}>
                            Contact sales
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="xm:col-span-7 col-span-12 lg:col-span-8 ">{content}</div>
                  {/* Sidebar */}
                </div>
              </article>
            </div>
          </div>

          <div className="mt-32">
            <h3 className="text-2xl">Read more case studies</h3>
            <div className="grid grid-cols-3 gap-8">
              {props.relatedPosts.map((post) => {
                return <NextCard post={post} />
              })}
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
