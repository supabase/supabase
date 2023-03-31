import { IconGitCommit } from 'ui'
import dayjs from 'dayjs'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'

export async function getStaticProps() {
  const response = await fetch('https://api.github.com/repos/supabase/supabase/releases')
  const data = await response.json()

  if (!data) {
    return {
      props: {
        notFound: true,
      },
    }
  }

  const changelogRenderToString = await Promise.all(
    data.map(async (item: any): Promise<any> => {
      const mdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)
      return {
        ...item,
        source: mdxSource,
      }
    })
  )

  return {
    props: {
      changelog: changelogRenderToString,
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
            {props.changelog.map((changelog: any, i: number) => {
              const date = changelog.published_at.split('T')
              return (
                <div
                  key={i}
                  className="border-scale-400 grid border-l pb-10 lg:grid-cols-12 lg:gap-8"
                >
                  <div
                    className="col-span-12 mb-8 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-32 lg:pt-32
                "
                  >
                    <div className="flex w-full items-baseline gap-6">
                      <div className="bg-scale-100 dark:bg-scale-500 border-scale-400 dark:border-scale-600 text-scale-900 -ml-2.5 flex h-5 w-5 items-center justify-center rounded border drop-shadow-sm">
                        <IconGitCommit size={14} strokeWidth={1.5} />
                      </div>
                      <div className="flex w-full flex-col gap-1">
                        {changelog.name && (
                          <h3 className="text-scale-1200 text-2xl">{changelog.name}</h3>
                        )}
                        <p className="text-scale-900 text-lg">
                          {dayjs(date[0]).format('MMM D, YYYY')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-8 ml-8 lg:ml-0">
                    <article className="prose prose-docs max-w-none">
                      <MDXRemote {...changelog.source} components={mdxComponents('blog')} />
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
