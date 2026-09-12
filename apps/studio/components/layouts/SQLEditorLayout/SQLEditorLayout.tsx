import { ReactNode } from 'react'

import { SqlEditorManualSaveNoticeDialog } from '@/components/interfaces/SQLEditor/SqlEditorManualSaveNoticeDialog'
import { withAuth } from '@/hooks/misc/withAuth'

export interface SQLEditorLayoutProps {
  children: ReactNode
}

const SQLEditorLayout = ({ children }: SQLEditorLayoutProps) => {
  return (
    <>
      {children}
      <SqlEditorManualSaveNoticeDialog />
    </>
  )
}

export default withAuth(SQLEditorLayout)
