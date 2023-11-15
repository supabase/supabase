import { ReactNode, useMemo } from 'react'
import { withAuth } from 'hooks'
import { ProjectLayoutNonBlocking } from '../'
import SQLEditorMenu from './SQLEditorMenu'

export interface SQLEditorLayoutProps {
  title: string
  children: ReactNode
}

const SQLEditorLayout = ({ title, children }: SQLEditorLayoutProps) => {
  const productMenu = useMemo(() => <SQLEditorMenu key="sql-editor-menu" />, [])

  return (
    <ProjectLayoutNonBlocking title={title || 'SQL'} product="SQL Editor" productMenu={productMenu}>
      {children}
    </ProjectLayoutNonBlocking>
  )
}

export default withAuth(SQLEditorLayout)
