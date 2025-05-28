import matter from 'gray-matter'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'ui'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import { SITE_ORIGIN } from '~/lib/constants'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'
import {
  getAllCMSCustomers,
  getAllCMSCustomerSlugs,
  getCMSCustomerBySlug,
} from '../../lib/cms-customers'

import type { GetStaticProps, InferGetStaticPropsType } from 'next'

// table of contents extractor
const toc = require('markdown-toc')

export async function getStaticPaths() {
  const staticPaths = getAllPostSlugs('_customers')
  const cmsSlugs = await getAllCMSCustomerSlugs()

  const paths = [...staticPaths, ...cmsSlugs]

  return {
    paths,
    fallback: false,
  }
}

type StaticAuthor = {
  author: string
  author_image_url: string | null
  author_url: string
  position: string
}

type CustomerData = {
  slug: string
  name: string
  title?: string
  description?: string
  content: any
  toc: any
  author?: string
  authors?: (CMSAuthor | StaticAuthor)[]
  about?: string
  company_url?: string
  logo?: string
  misc?: {
    label: string
    text: string
  }[]
  date: string
  categories?: string[]
  tags?:
    | string[]
    | Array<{
        id: number
        documentId: string
        name: string
        createdAt: string
        updatedAt: string
        publishedAt: string
      }>
  toc_depth?: number
  video?: string
  docs_url?: string
  blog_url?: string
  url?: string
  source: string
  image?: string
  thumb?: string
  youtubeHero?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  isCMS?: boolean
}

type MatterReturn = {
  data: CustomerData
  content: string
}

type CMSAuthor = {
  author: string
  author_image_url: {
    url: string
  }
  author_url: string
  position: string
}

type Post = ReturnType<typeof getSortedPosts>[number]

type CustomerPageProps = {
  prevPost: Post | null
  nextPost: Post | null
  relatedPosts: Post[]
  customer: CustomerData
}

type Params = {
  slug: string
}

export const getStaticProps: GetStaticProps<CustomerPageProps, Params> = async ({
  params,
  preview = false,
}) => {
  if (!params?.slug) {
    throw new Error('Missing slug for pages/blog/[slug].tsx')
  }

  const slug = `${params.slug}`
  console.log(
    `[getStaticProps] generating for slug: '${slug}', preview mode: ${preview ? 'true' : 'false'}`
  )

  // Try static post first
  try {
    const postContent = await getPostdata(slug, '_customers')
    const parsedContent = matter(postContent) as unknown as MatterReturn
    const content = parsedContent.content
    const mdxSource = await mdxSerialize(content)
    const blogPost = { ...parsedContent.data }

    // Get all posts for navigation and related posts
    const allStaticPosts = getSortedPosts({ directory: '_customers' })
    const allCmsPosts = await getAllCMSCustomers()
    const allPosts = [...allStaticPosts, ...allCmsPosts].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const currentIndex = allPosts.findIndex((post) => post.slug === slug)
    const nextPost = currentIndex === allPosts.length - 1 ? null : allPosts[currentIndex + 1]
    const prevPost = currentIndex === 0 ? null : allPosts[currentIndex - 1]
    const tocResult = toc(content, { maxdepth: blogPost.toc_depth ? blogPost.toc_depth : 2 })
    const processedContent = tocResult.content.replace(/%23/g, '')
    const relatedPosts = getSortedPosts({
      directory: '_blog',
      limit: 3,
      tags: mdxSource.scope.tags,
      currentPostSlug: slug,
    }) as unknown as (CustomerData & Post)[]

    return {
      props: {
        prevPost,
        nextPost,
        relatedPosts,
        customer: {
          ...blogPost,
          content: mdxSource,
          toc: {
            ...tocResult,
            content: processedContent,
          },
        },
      },
      revalidate: 60 * 10, // Revalidate every 10 minutes
    }
  } catch (error) {
    console.log('[getStaticProps] Static post not found, trying CMS post...')
    // Not a static post, try CMS
  }

  // Try CMS post (handle preview/draft logic)
  const cmsPost = await getCMSCustomerBySlug(slug, preview)

  console.log('cmsPost', cmsPost)

  if (!cmsPost) {
    console.log(
      '[getStaticProps] No CMS post found, checking published version (if in preview mode)...'
    )
    // Try to fetch published version if preview mode failed
    if (preview) {
      console.log(
        '[getStaticProps] In preview mode but no draft found, trying published version...'
      )
      const publishedPost = await getCMSCustomerBySlug(slug, false)
      if (!publishedPost) {
        console.log('[getStaticProps] No published version found either, returning 404')
        return { notFound: true }
      }
      console.log('[getStaticProps] Found published version, using that for preview')
      const mdxSource = await mdxSerialize(publishedPost.content || '')

      console.log('publishedPost', publishedPost)
      return {
        props: {
          prevPost: null,
          nextPost: null,
          relatedPosts: [],
          customer: {
            ...publishedPost,
            tags: publishedPost.tags || [],
            authors: publishedPost.authors || [],
            isCMS: true,
            content: mdxSource,
            toc: publishedPost.toc,
            image: publishedPost.image ?? undefined,
            // thumb: publishedPost.thumb ?? undefined,
          },
        },
        revalidate: 60 * 10,
      }
    }
    console.log('[getStaticProps] Not in preview mode and no CMS post found, returning 404')
    return { notFound: true }
  }

  // For CMS posts, process content
  console.log('[getStaticProps] Processing CMS post data for render')
  const mdxSource = await mdxSerialize(cmsPost.content || '')

  return {
    props: {
      prevPost: null,
      nextPost: null,
      relatedPosts: [],
      customer: {
        ...cmsPost,
        tags: cmsPost.tags || [],
        authors: cmsPost.authors || [],
        isCMS: true,
        content: mdxSource,
        toc: cmsPost.toc,
        // image: cmsPost.image ?? undefined,
        // thumb: cmsPost.thumb ?? undefined,
      },
    },
    revalidate: 60 * 10,
  }
}

function CaseStudyPage(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const {
    about,
    company_url,
    content,
    date,
    description,
    logo,
    meta_description,
    meta_title,
    misc,
    name,
    slug,
    title,
  } = props.customer

  const ogImageUrl = encodeURI(
    `${process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:54321' : 'https://obuldanrptloktxcffvn.supabase.co'}/functions/v1/og-images?site=customers&customer=${slug}&title=${meta_title ?? title}`
  )

  const meta = {
    title: meta_title ?? `${name} | Supabase Customer Stories`,
    description: meta_description ?? description,
    image: ogImageUrl ?? `${SITE_ORIGIN}/images/customers/og/customer-stories.jpg`,
    url: `${SITE_ORIGIN}/customers/${slug}`,
  }

  return (
    <>
      <NextSeo
        title={meta.title}
        openGraph={{
          title: meta.title,
          description: meta.description,
          url: meta.url,
          type: 'article',
          article: {
            //
            // to do: add expiration and modified dates
            // https://github.com/garmeeh/next-seo#article
            publishedTime: date,
          },
          images: [
            {
              url: meta.image,
              alt: `${meta.title} thumbnail`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div
          className="
            container mx-auto p-8 sm:py-16 sm:px-16
            xl:px-20
          "
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="hidden xl:block col-span-12 mb-2 xl:col-span-2">
              {/* Back button */}
              <Link
                href="/customers"
                className="text-foreground-lighter hover:text-foreground flex cursor-pointer items-center text-sm transition"
              >
                <ChevronLeft style={{ padding: 0 }} />
                Back
              </Link>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <div>
                <article className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4 sm:gap-8 max-w-xxl">
                    <Link
                      href="/customers"
                      className="text-brand hover:text-brand-600 sm:mb-2 mt-0"
                    >
                      Customer Stories
                    </Link>
                    <h1 className="text-foreground text-4xl font-semibold xl:text-5xl">{title}</h1>
                    <p className="text-foreground text-xl xl:text-2xl">{description}</p>
                  </div>

                  <div className="grid grid-cols-12 prose max-w-none gap-8 lg:gap-20">
                    <div className="col-span-12 lg:col-span-4 lg:block xl:col-span-4">
                      <div className="space-y-8 lg:sticky lg:top-24 lg:mb-24">
                        {/* Logo */}
                        <div className="relative h-16 w-32 lg:mt-5">
                          {logo && (
                            <Image
                              fill
                              src={logo}
                              alt={`${title} logo`}
                              priority
                              placeholder="blur"
                              blurDataURL="/images/blur.png"
                              draggable={false}
                              className="
                              bg-no-repeat
                              object-left
                              object-contain
                              m-0

                              [[data-theme*=dark]_&]:brightness-200
                              [[data-theme*=dark]_&]:contrast-0
                              [[data-theme*=dark]_&]:filter
                            "
                            />
                          )}
                        </div>

                        <div className="flex flex-col space-y-2">
                          <span className="text-foreground-lighter">About</span>
                          <p>{about}</p>
                          {company_url && (
                            <span className="not-prose ">
                              <a
                                href={company_url}
                                className="flex cursor-pointer items-center space-x-1 transition-opacity text-foreground-lightround-ligtext-foreground-light:text-foreground-light"
                                target="_blank"
                              >
                                <span>{company_url}</span>
                                <ExternalLink size={14} />
                              </a>
                            </span>
                          )}
                        </div>

                        {misc?.map((x: any) => {
                          return (
                            <div className="flex flex-col gap-0">
                              <span className="text-foreground-lighter">{x.label}</span>
                              <span className="text-foreground-light">{x.text}</span>
                            </div>
                          )
                        })}

                        <div>
                          <p>Ready to get started?</p>
                          <div>
                            <Button asChild type="default" iconRight={<ChevronRight />}>
                              <Link
                                href="https://supabase.com/contact/enterprise"
                                className="no-underline"
                              >
                                Contact sales
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="xm:col-span-7 col-span-12 lg:col-span-8 xl:col-span-8 ">
                      <MDXRemote {...content} components={mdxComponents()} />
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default CaseStudyPage
