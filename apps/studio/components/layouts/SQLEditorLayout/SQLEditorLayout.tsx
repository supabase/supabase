import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'
import { withAuth } from 'hooks/misc/withAuth'
import { ReactNode, useState } from 'react'
import { EditorBaseLayout } from '../editors/editor-base-layout'
import { SQLEditorMenu } from './SQLEditorMenu'

export interface SQLEditorLayoutProps {
  // title: string
  children: ReactNode
}

const SQLEditorLayout = ({ children }: SQLEditorLayoutProps) => {
  const [showOngoingQueries, setShowOngoingQueries] = useState(false)

  return (
    // <EditorBaseLayout
    //   title={title || 'SQL'}
    //   product="SQL Editor"
    //   productMenu={
    //     <SQLEditorMenu
    //       key="sql-editor-menu"
    //       onViewOngoingQueries={() => setShowOngoingQueries(true)}
    //     />
    //   }
    //   isBlocking={false}
    //   resizableSidebar
    // >
    <>
      {children}
      <OngoingQueriesPanel
        visible={showOngoingQueries}
        onClose={() => setShowOngoingQueries(false)}
      />
    </>
    // </EditorBaseLayout>
  )
}

export default withAuth(SQLEditorLayout)
