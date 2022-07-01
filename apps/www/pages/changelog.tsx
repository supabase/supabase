import dayjs from 'dayjs'
import matter from 'gray-matter'
import hydrate from 'next-mdx-remote/hydrate'
import renderToString from 'next-mdx-remote/render-to-string'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import CTABanner from '~/components/CTABanner'
import ImageGrid from '~/components/ImageGrid'
import DefaultLayout from '~/components/Layouts/Default'
import Quote from '~/components/Quote'
import { getPostdata } from '~/lib/posts'

import fs from 'fs'
import { IconCornerDownRight, IconGitCommit, IconPlus, IconPlusCircle } from '@supabase/ui'

// import all components used in blog articles here

// to do: move this into a helper/utils, it is used elsewhere

const components = {
  CodeBlock,
  Quote,
  Avatar,
  code: (props: any) => {
    return <CodeBlock {...props} />
  },
  ImageGrid,
  img: (props: any) => {
    const classes = [
      'next-image--dynamic-fill',
      'from-brand-500 to-brand-500',
      'rounded border bg-gradient-to-r via-blue-500',
    ]

    return (
      <div
        className="
          next-image--dynamic-fill 
            to-scale-400  
            from-scale-500 rounded-md
            border bg-gradient-to-r
      "
      >
        <Image
          {...props}
          className="next-image--dynamic-fill to-brand-1000 from-brand-900 rounded-md border bg-gradient-to-r"
          layout="fill"
        />
      </div>
    )
  },
}

export async function getStaticProps({ params }: any) {
  // plugins for next-mdx-remote
  const gfm = require('remark-gfm')
  const slug = require('rehype-slug')

  const filenames = fs.readdirSync('_changelog')
  console.log('filenames', filenames)

  const changelogContent: any[] = []

  await Promise.all(
    filenames.map(async (filepath: string) => {
      // clean up filepath
      const filePathModified = filepath.replace('.mdx', '')
      // get post data from markdown
      const postContent = await getPostdata(filePathModified, '_changelog')
      // extract content and frontmatter from post
      const { data, content } = matter(postContent)
      // Runs the MDX renderer on the MDX string provided with the components and data provided.
      const mdxSource: any = await renderToString(content, {
        components,
        scope: data,
        mdxOptions: {
          remarkPlugins: [gfm],
          rehypePlugins: [slug],
        },
      })
      // add page to array of changelogs
      return changelogContent.push({ content: mdxSource, ...data })
    })
  )

  return {
    props: {
      changelog: changelogContent,
    },
  }
}

function ChangelogPage(props: any) {
  return (
    <>
      <NextSeo
        title={'Changelog'}
        openGraph={{
          title: 'Changelog',
          description: 'props.blog.description',
          url: `https://supabase.com/changelog`,
          type: 'article',
          article: {
            //
            // to do: add expiration and modified dates
            // https://github.com/garmeeh/next-seo#article
            // publishedTime: props.blog.date,
          },
          // images: [
          //   {
          //     url: `https://supabase.com${basePath}/images/blog/${
          //       props.blog.image ? props.blog.image : props.blog.thumb
          //     }`,
          //   },
          // ],
        }}
      />
      <DefaultLayout>
        <div
          className="
            container mx-auto flex flex-col
            gap-20
            px-8 py-10 sm:px-16
            xl:px-20
          "
        >
          {/* Title and description */}
          <div className="py-10">
            <h1 className="h1">Changelog</h1>
            <p className="text-scale-900 text-lg">New updates and product improvements</p>
          </div>

          {/* Content */}

          <div>
            {props.changelog.map((x: any) => {
              // const content = hydrate(x.content, { components })
              const content = hydrate(x.content, { components })

              return (
                <div className="grid pb-10 lg:grid-cols-12  lg:border-l">
                  <div
                    className="col-span-4 mb-8 self-start lg:sticky lg:top-0 lg:-mt-32 lg:pt-32
                "
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-scale-300 border-scale-400 text-scale-900 flex h-5 w-5 items-center justify-center rounded border lg:-ml-2.5">
                        <IconGitCommit size={14} strokeWidth={1.5} />
                      </div>
                      <p className="text-scale-900 text-lg">
                        {dayjs(x.date).format('MMM D, YYYY')}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-8">
                    <article className={['prose prose-docs max-w-none'].join(' ')}>
                      {' '}
                      {content}
                    </article>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default ChangelogPage
