'use client'

import 'katex/dist/katex.min.css'

import { type FC } from 'react'

import { FooterHelpCalloutType } from '~/components/FooterHelpCallout'
import { type MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { MainSkeleton } from '~/layouts/MainSkeleton'

interface Props {
  meta?: {
    title: string
    description?: string // used in meta tags
    hide_table_of_contents?: boolean
    breadcrumb?: string
    subtitle?: string // used on the page under the H1
    footerHelpType?: FooterHelpCalloutType
    video?: string
    tocVideo?: string
    canonical?: string
  }
  editLink?: string
  children: any
  toc?: any
  currentPage?: string
  hideToc?: boolean
  menuId: MenuId
}

const Layout: FC<Props> = (props) => {
  const menuId = props.menuId

  /* // page type, ie, Auth, Database, Storage etc
  const ogPageType = pathname?.split('/')[2]
  // open graph image url constructor
  const ogImageUrl = encodeURI(
    `https://obuldanrptloktxcffvn.supabase.co/functions/v1/og-images?site=docs${
      ogPageType ? `&type=${ogPageType}` : ''
    }&title=${props.meta?.title}&description=${props.meta?.description}`
  ) */

  return (
    <>
      {/* <NextSeo
			title={`${props.meta?.title} | Supabase Docs`}
			canonical={props.meta?.canonical ?? `https://supabase.com/docs${pathname}`}
			openGraph={{
			  url: `https://supabase.com/docs${pathname}`,
			  type: 'article',
			  siteName: 'Supabase',
			  title: `${props.meta?.title} | Supabase Docs`,
			  description: props.meta?.description,
			  images: [
				{
				  url: ogImageUrl,
				  width: 800,
				  height: 600,
				  alt: props.meta?.title,
				},
			  ],
			  // @ts-ignore
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
			twitter={{
			  cardType: 'summary_large_image',
			  site: '@supabase',
			  handle: '@supabase',
			}}
		  /> */}
      <MainSkeleton menuId={menuId}>
        <LayoutMainContent className="pb-0">{props.children}</LayoutMainContent>
      </MainSkeleton>
    </>
  )
}

export default Layout
