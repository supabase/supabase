import { Button, IconChevronRight, IconExternalLink } from '@supabase/ui'
import matter from 'gray-matter'

import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronLeft, IconChevronsLeft } from '~/../../packages/ui'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { getAllPostSlugs, getPostdata, getSortedPosts } from '~/lib/posts'

// table of contents extractor
const toc = require('markdown-toc')

export async function getStaticPaths() {
  const paths = getAllPostSlugs('_case-studies')
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }: any) {
  const filePath = `${params.slug}`
  const postContent = await getPostdata(filePath, '_case-studies')
  const { data, content } = matter(postContent)
  const mdxSource: any = await mdxSerialize(content)

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

  const { basePath } = useRouter()

  // const NextCard = (props: any) => {
  //   const { post, label, className } = props
  //   return (
  //     <Link href={`/blog/${post.url}`} as={`/blog/${post.url}`}>
  //       <div className={className}>
  //         <div className="bg-scale-100 hover:bg-scale-200 dark:bg-scale-200 dark:hover:bg-scale-300 flex cursor-pointer items-center justify-center rounded-lg border p-3 drop-shadow-none transition-all hover:drop-shadow-lg ">
  //           <div className="relative flex h-40 w-40">
  //             <Image
  //               layout="fill"
  //               src={`${post.logo}`}
  //               alt={`${post.title} logo`}
  //               objectFit="scale-down"
  //               objectPosition="center"
  //               className="
  //                     bg-no-repeat
  //                     dark:brightness-200
  //                     dark:contrast-0
  //                     dark:filter
  //                   "
  //             />
  //           </div>
  //         </div>
  //       </div>
  //     </Link>
  //   )
  // }

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
            container mx-auto px-8 py-16 sm:px-16
            xl:px-20
          "
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 mb-2 lg:col-span-2">
              {/* Back button */}
              <p>
                <a
                  href={'/case-studies'}
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
                    <Link passHref href="/case-studies">
                      <a className="text-brand-900 hover:text-brand-1000 mb-2 mt-0">Case Studies</a>
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
                        <div className="flex flex-col md:flex-row lg:flex-col gap-8 justify-between">
                          {/* {props.blog.stats.map((x: any) => {
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
                      })} */}
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
                    <div className="xm:col-span-7 col-span-12 lg:col-span-8 xl:col-span-8 ">
                      <MDXRemote {...content} components={mdxComponents()} />
                    </div>
                    {/* Sidebar */}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="mt-32">
          <h3 className="text-2xl">Read more case studies</h3>
          <div className="grid grid-cols-3 gap-8">
            {props.relatedPosts.map((post) => {
                return <NextCard post={post} />
              })}
          </div>
        </div> */}

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default CaseStudyPage
