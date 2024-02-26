import { withAuth } from 'hooks'
import { ReactNode, useMemo } from 'react'
import ProjectLayout from '../'
import SQLEditorMenu from './SQLEditorMenu'

export interface SQLEditorLayoutProps {
  title: string
  children: ReactNode
}

const SQLEditorLayout = ({ title, children }: SQLEditorLayoutProps) => {
  const productMenu = useMemo(() => <SQLEditorMenu key="sql-editor-menu" />, [])

  return (
    <ProjectLayout
      title={title || 'SQL'}
      product="SQL Editor"
      productMenu={productMenu}
      isBlocking={false}
      resizableSidebar
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SQLEditorLayout)
