import authors from 'lib/authors.json'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import { generateReadingTime } from '~/lib/helpers'
import { MDXRemote } from 'next-mdx-remote'

interface Props {
  components: React.ReactNode
  props: any
}

const LayoutComparison = ({ components, props }: Props) => {
  // @ts-ignore
  const content = props.blog.content

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
      <Link href={`${post.url}`} as={`${post.url}`}>
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

  return (
    <>
      <NextSeo
        title={props.blog.title}
        openGraph={{
          title: props.blog.title,
          description: props.blog.description,
          url: `https://supabase.com/alternatives/${props.blog.slug}`,
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
              url: `https://supabase.com${basePath}/images/blog/${
                props.blog.image ? props.blog.image : props.blog.thumb
              }`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <article className="mx-auto max-w-5xl px-8 py-16 sm:px-16 xl:px-20">
          {/* Title and description */}
          <div className="mb-16 max-w-5xl space-y-8">
            <div className="space-y-4">
              <p className="text-brand-900 text-center">Alternative</p>
              <h1 className="h1 text-center">{props.blog.title}</h1>
              <div className="text-scale-900 flex justify-center space-x-3 text-sm">
                <p>{props.blog.date}</p>
                <p>•</p>
                <p>{generateReadingTime(props.blog.source)}</p>
              </div>
              <div className="flex justify-center gap-3">
                {author.map((author: any) => {
                  return (
                    <div className="mt-6 mb-8 mr-4 w-max lg:mb-0">
                      <Link href={author.author_url}>
                        <a className="cursor-pointer">
                          <div className="flex items-center gap-3">
                            {author.author_image_url && (
                              <div className="w-10">
                                <Image
                                  src={author.author_image_url}
                                  className="dark:border-dark rounded-full border"
                                  width="100%"
                                  height="100%"
                                  layout="responsive"
                                />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-scale-1200 mb-0 text-sm">{author.author}</span>
                              <span className="text-scale-900 mb-0 text-xs">{author.position}</span>
                            </div>
                          </div>
                        </a>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="">
            {/* Content */}
            <div className="prose prose-docs max-w-none">
              <MDXRemote {...content} components={components} />
            </div>
            <div className="py-16">
              <div className="text-scale-900 dark:text-scale-1000 text-sm">Share this article</div>
              <div className="mt-4 flex items-center space-x-4">
                <Link
                  passHref
                  href={`https://twitter.com/share?text=${props.blog.title}&url=https://supabase.com/blog/${props.blog.slug}`}
                >
                  <a target="_blank" className="text-scale-900 hover:text-scale-1200">
                    <svg
                      height="26"
                      width="26"
                      viewBox="-89 -46.8 644 446.8"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                    >
                      <path
                        d="m154.729 400c185.669 0 287.205-153.876 287.205-287.312 0-4.37-.089-8.72-.286-13.052a205.304 205.304 0 0 0 50.352-52.29c-18.087 8.044-37.55 13.458-57.968 15.899 20.841-12.501 36.84-32.278 44.389-55.852a202.42 202.42 0 0 1 -64.098 24.511c-18.42-19.628-44.644-31.904-73.682-31.904-55.744 0-100.948 45.222-100.948 100.965 0 7.925.887 15.631 2.619 23.025-83.895-4.223-158.287-44.405-208.074-105.504a100.739 100.739 0 0 0 -13.668 50.754c0 35.034 17.82 65.961 44.92 84.055a100.172 100.172 0 0 1 -45.716-12.63c-.015.424-.015.837-.015 1.29 0 48.903 34.794 89.734 80.982 98.986a101.036 101.036 0 0 1 -26.617 3.553c-6.493 0-12.821-.639-18.971-1.82 12.851 40.122 50.115 69.319 94.296 70.135-34.549 27.089-78.07 43.224-125.371 43.224a204.9 204.9 0 0 1 -24.078-1.399c44.674 28.645 97.72 45.359 154.734 45.359"
                        fillRule="nonzero"
                      />
                    </svg>
                  </a>
                </Link>

                <Link
                  passHref
                  href={`https://www.linkedin.com/shareArticle?url=https://supabase.com/blog/${props.blog.slug}&title=${props.blog.title}`}
                >
                  <a target="_blank" className="text-scale-900 hover:text-scale-1200">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 5 1036 990"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                    >
                      <path d="M0 120c0-33.334 11.667-60.834 35-82.5C58.333 15.833 88.667 5 126 5c36.667 0 66.333 10.666 89 32 23.333 22 35 50.666 35 86 0 32-11.333 58.666-34 80-23.333 22-54 33-92 33h-1c-36.667 0-66.333-11-89-33S0 153.333 0 120zm13 875V327h222v668H13zm345 0h222V622c0-23.334 2.667-41.334 8-54 9.333-22.667 23.5-41.834 42.5-57.5 19-15.667 42.833-23.5 71.5-23.5 74.667 0 112 50.333 112 151v357h222V612c0-98.667-23.333-173.5-70-224.5S857.667 311 781 311c-86 0-153 37-201 111v2h-1l1-2v-95H358c1.333 21.333 2 87.666 2 199 0 111.333-.667 267.666-2 469z" />
                    </svg>
                  </a>
                </Link>
              </div>
            </div>
            <div className="grid gap-8 py-8 lg:grid-cols-1">
              <div>
                {props.prevPost && <NextCard post={props.prevPost} label="Previous comparison" />}
              </div>
              <div>
                {props.nextPost && (
                  <NextCard post={props.nextPost} label="Next comparison" className="text-right" />
                )}
              </div>
            </div>
          </div>
        </article>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default LayoutComparison
