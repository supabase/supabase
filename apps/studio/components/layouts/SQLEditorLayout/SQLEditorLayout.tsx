import { ReactNode } from 'react'

import { OngoingQueriesPanel } from '@/components/interfaces/SQLEditor/OngoingQueriesPanel'
import { withAuth } from '@/hooks/misc/withAuth'

export interface SQLEditorLayoutProps {
  children: ReactNode
}

const SQLEditorLayout = ({ children }: SQLEditorLayoutProps) => {
  return (
    <>
      {children}
      <OngoingQueriesPanel />
    </>
  )
}

export default withAuth(SQLEditorLayout)
