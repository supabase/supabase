import { OngoingQueriesPanel } from 'components/interfaces/SQLEditor/OngoingQueriesPanel'
import { withAuth } from 'hooks/misc/withAuth'
import { ReactNode } from 'react'

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
