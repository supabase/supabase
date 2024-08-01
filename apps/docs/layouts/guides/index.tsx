'use client'

import 'katex/dist/katex.min.css'

import { type FC } from 'react'

import { FooterHelpCalloutType } from '~/components/FooterHelpCallout'
import { type MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

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

  return (
    <SidebarSkeleton menuId={menuId}>
      <LayoutMainContent className="pb-0">{props.children}</LayoutMainContent>
    </SidebarSkeleton>
  )
}

export default Layout
