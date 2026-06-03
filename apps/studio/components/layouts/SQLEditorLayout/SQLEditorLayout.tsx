import { ReactNode } from 'react'

import { OngoingQueriesPanel } from '@/components/interfaces/SQLEditor/OngoingQueriesPanel'
import { useRestorePersistedDraftSqlTabs } from '@/components/interfaces/SQLEditor/useRestorePersistedDraftSqlTabs'
import { withAuth } from '@/hooks/misc/withAuth'

export interface SQLEditorLayoutProps {
  children: ReactNode
}

const SQLEditorLayout = ({ children }: SQLEditorLayoutProps) => {
  useRestorePersistedDraftSqlTabs()

  return (
    <>
      {children}
      <OngoingQueriesPanel />
    </>
  )
}

export default withAuth(SQLEditorLayout)
