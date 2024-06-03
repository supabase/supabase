import { withAuth } from 'hooks'
import { ReactNode, useMemo, useState } from 'react'
import { ProjectLayout } from '../'
import { SQLEditorMenu } from './SQLEditorMenu'
import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'

export interface SQLEditorLayoutProps {
  title: string
  children: ReactNode
}

const SQLEditorLayout = ({ title, children }: SQLEditorLayoutProps) => {
  const [showOngoingQueries, setShowOngoingQueries] = useState(false)
  const productMenu = useMemo(
    () => (
      <SQLEditorMenu
        key="sql-editor-menu"
        onViewOngoingQueries={() => setShowOngoingQueries(true)}
      />
    ),
    []
  )

  return (
    <ProjectLayout
      title={title || 'SQL'}
      product="SQL Editor"
      productMenu={productMenu}
      isBlocking={false}
      resizableSidebar
    >
      {children}
      <OngoingQueriesPanel
        visible={showOngoingQueries}
        onClose={() => setShowOngoingQueries(false)}
      />
    </ProjectLayout>
  )
}

export default withAuth(SQLEditorLayout)
