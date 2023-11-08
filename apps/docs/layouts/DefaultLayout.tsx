import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FC, PropsWithChildren } from 'react'
import components from '~/components'
import TableOfContents from '~/components/TableOfContents'

interface Props {
  meta: {
    title: string
    description?: string
    hide_table_of_contents?: boolean
    video?: string
    tocVideo?: string
    canonical?: string
  }
  children: any
  toc?: any
  menuItems: any
}

const Layout: FC<Props> = (props: Props) => {
  const { asPath } = useRouter()

  const hasTableOfContents =
    props.toc !== undefined &&
    props.toc.json.filter((item) => item.lvl !== 1 && item.lvl <= 3).length > 0

  return (
    <>
      <Head>
        <title>{asPath === '/' ? 'Supabase Docs' : `${props.meta?.title} | Supabase Docs`}</title>
        <meta name="description" content={props.meta?.description} />
        <meta property="og:image" content={`https://supabase.com/docs/img/supabase-og-image.png`} />
        <meta
          name="twitter:image"
          content={`https://supabase.com/docs/img/supabase-og-image.png`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <NextSeo
        canonical={props.meta?.canonical ?? `https://supabase.com/docs${asPath}`}
        openGraph={{
          url: `https://supabase.com/docs${asPath}`,
          type: 'article',
          videos: props.meta?.video && [
            {
              // youtube based video meta
              url: props.meta?.video,
              width: 640,
              height: 385,
              type: 'application/x-shockwave-flash',
            },
          ],
          article: {
            publishedTime: new Date().toISOString(),
            modifiedTime: new Date().toISOString(),
            authors: ['Supabase'],
          },
        }}
      />
      <LayoutMainContent>
        <div className={['relative transition-all ease-out', 'duration-150 '].join(' ')}>
          <article className="prose dark:prose-dar max-w-none">
            <h1>{props.meta.title}</h1>
            <MDXProvider components={components}>{props.children}</MDXProvider>
          </article>
        </div>
        {hasTableOfContents && !props.meta?.hide_table_of_contents && (
          <div
            className={[
              'border-default bg-background table-of-contents-height border-l',
              'thin-scrollbar overflow-y-auto sticky hidden md:block md:col-span-3 px-2',
            ].join(' ')}
          >
            <TableOfContents toc={props.toc} video={props.meta.video} />
          </div>
        )}
      </LayoutMainContent>
    </>
  )
}

export const LayoutMainContent: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => <div className={['max-w-7xl px-5 mx-auto py-16', className].join(' ')}>{children}</div>

export default Layout
