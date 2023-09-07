import { Button, IconChevronRight, IconExternalLink } from '@supabase/ui'
import matter from 'gray-matter'

import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { IconChevronLeft } from 'ui'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'
import { SITE_ORIGIN } from '~/lib/constants'

// table of contents extractor
const toc = require('markdown-toc')

export async function getStaticPaths() {
  const paths = getAllPostSlugs('_customers')
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }: any) {
  const filePath = `${params.slug}`
  const postContent = await getPostdata(filePath, '_customers')
  const { data, content } = matter(postContent)
  const mdxSource: any = await mdxSerialize(content)

  const relatedPosts = getSortedPosts({
    directory: '_customers',
    limit: 5,
    tags: mdxSource.scope.tags,
    currentPostSlug: filePath,
  })

  const allPosts = getSortedPosts({ directory: '_customers' })
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
        slug: `${params.slug}`,
        content: mdxSource,
        source: content,
        ...data,
        toc: toc(content, { maxdepth: data.toc_depth ? data.toc_depth : 2 }),
      },
    },
  }
  return payload
}

function CaseStudyPage(props: any) {
  const content = props.blog.content

  const meta = {
    title: props.blog.meta_title ?? `${props.blog.name} | Supabase Customer Stories`,
    description: props.blog.meta_description ?? props.blog.description,
    image:
      `${SITE_ORIGIN}${props.blog.og_image}` ??
      `${SITE_ORIGIN}/images/customers/og/customer-stories.jpg`,
    url: `${SITE_ORIGIN}/customers/${props.blog.slug}`,
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
            publishedTime: props.blog.date,
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
            container mx-auto px-8 py-16 sm:px-16
            xl:px-20
          "
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 mb-2 xl:col-span-2">
              {/* Back button */}
              <p>
                <a
                  href={'/customers'}
                  className="text-scale-900 hover:text-scale-1200 flex cursor-pointer items-center text-sm transition"
                >
                  <IconChevronLeft style={{ padding: 0 }} />
                  Back
                </a>
              </p>
            </div>

            <div
              className="col-span-12 lg:col-span-8

          "
            >
              <div className="">
                <article className="flex flex-col gap-8">
                  <div className="flex flex-col gap-8 max-w-xxl">
                    <Link passHref href="/customers">
                      <a className="text-brand hover:text-brand-600 mb-2 mt-0">Customer Stories</a>
                    </Link>
                    <h1 className="text-scale-1200 text-4xl font-semibold xl:text-5xl">
                      {props.blog.title}
                    </h1>
                    <h2 className="text-scale-1200 text-xl xl:text-2xl">
                      {props.blog.description}
                    </h2>
                  </div>

                  <div className="grid grid-cols-12 prose max-w-none gap-8 lg:gap-20">
                    <div className="col-span-12 lg:col-span-4 lg:block xl:col-span-4">
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
                              target="_blank"
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

                        <div className="">
                          <p>Ready to get started?</p>
                          <div>
                            <Link href="https://supabase.com/contact/enterprise">
                              <a className="no-underline">
                                <Button type="default" iconRight={<IconChevronRight />}>
                                  Contact sales
                                </Button>
                              </a>
                            </Link>
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
