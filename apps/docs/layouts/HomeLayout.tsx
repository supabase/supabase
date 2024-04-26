import { MDXProvider } from '@mdx-js/react'
import { NextSeo } from 'next-seo'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FC } from 'react'
import components from '~/components'
import HomePageCover from '~/components/HomePageCover'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { LayoutMainContent } from './DefaultLayout'
import { MainSkeleton } from './MainSkeleton'

interface Props {
  meta: {
    title: string
    canonical?: string
    description?: string
    video?: string
  }
  children: any
}

const HomeLayout: FC<Props> = (props: Props) => {
  const { asPath } = useRouter()

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
      <MainSkeleton menuId={MenuId.Home}>
        <article>
          <HomePageCover meta={props.meta} />
          <LayoutMainContent>
            <div className={['relative transition-all ease-out', 'duration-150 '].join(' ')}>
              <div className="prose max-w-none">
                <MDXProvider components={components}>{props.children}</MDXProvider>
              </div>
            </div>
          </LayoutMainContent>
        </article>
      </MainSkeleton>
    </>
  )
}

export default HomeLayout
