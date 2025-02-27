import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'
import { withAuth } from 'hooks/misc/withAuth'
import { ReactNode, useMemo } from 'react'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { SQLEditorMenu } from './SQLEditorMenu'

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
      <OngoingQueriesPanel />
    </ProjectLayout>
  )
}

export default withAuth(SQLEditorLayout)
