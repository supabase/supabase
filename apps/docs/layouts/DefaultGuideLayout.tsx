import { FC } from 'react'
import GuideLayout from './guides'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean; video?: string }
  children: any
  toc?: any
  currentPage?: string
}

const Layout: FC<Props> = (props) => {
  return GuideLayout(props)
}

export default Layout
