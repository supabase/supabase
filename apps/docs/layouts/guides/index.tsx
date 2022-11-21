import NewLayout from './current'
import OldLayout from './archived'
import { FC } from 'react'

interface Props {
  meta: { title: string; description?: string; hide_table_of_contents?: boolean; video?: string }
  children: any
  toc?: any
  currentPage: string
}

const Layout: FC<Props> = (props) => {
  switch (process.env.NEXT_PUBLIC_NEW_DOCS) {
    case 'true':
      return NewLayout(props)
      break
    default:
      return OldLayout(props)
      break
  }
}

export default Layout
