import { FC } from 'react'
import { FooterHelpCalloutType } from '~/components/FooterHelpCallout'
import { type MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import GuideLayout from './guides'

interface Props {
  meta: {
    title: string
    description?: string
    hide_table_of_contents?: boolean
    video?: string
    footerHelpType?: FooterHelpCalloutType
  }
  children: any
  toc?: any
  // [Charis] Deprecate meta.hide_table_of_contents once the content migration is over
  hideToc?: boolean
  currentPage?: string
  editLink?: string
  menuId: MenuId
}

const Layout: FC<Props> = (props) => {
  return GuideLayout(props)
}

export default Layout
