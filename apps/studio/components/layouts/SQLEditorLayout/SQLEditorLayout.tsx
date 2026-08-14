import { ReactNode } from 'react'

import { OngoingQueriesPanel } from '@/components/interfaces/SQLEditor/OngoingQueriesPanel'
import { SqlEditorManualSaveNoticeDialog } from '@/components/interfaces/SQLEditor/SqlEditorManualSaveNoticeDialog'
import { withAuth } from '@/hooks/misc/withAuth'

export interface SQLEditorLayoutProps {
  children: ReactNode
}

const SQLEditorLayout = ({ children }: SQLEditorLayoutProps) => {
  return (
    <>
      {children}
      <OngoingQueriesPanel />
      <SqlEditorManualSaveNoticeDialog />
    </>
  )
}

export default withAuth(SQLEditorLayout)
