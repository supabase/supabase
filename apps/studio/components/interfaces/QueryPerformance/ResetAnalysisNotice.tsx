import { useState } from 'react'
import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { executeSql } from 'data/sql/execute-sql-query'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'

export const ResetAnalysisNotice = ({ handleRefresh }: { handleRefresh: () => void }) => {
  const { project } = useProjectContext()
  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)

  return (
    <>
      <Alert_Shadcn_>
        <AlertTitle_Shadcn_>
          Consider resetting the analysis after optimizing any queries
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          This will ensure that the performance metrics are updated with the latest changes
        </AlertDescription_Shadcn_>
        <Button type="default" className="mt-3" onClick={() => setShowResetgPgStatStatements(true)}>
          Reset performance analysis
        </Button>
      </Alert_Shadcn_>

      <ConfirmModal
        danger
        visible={showResetgPgStatStatements}
        title="Reset query performance analysis"
        description={
          'This will reset the `extensions.pg_stat_statements` table that is used to calculate query performance. This data will repopulate immediately after.'
        }
        buttonLabel="Clear table"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setShowResetgPgStatStatements(false)}
        onSelectConfirm={async () => {
          try {
            await executeSql({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              sql: `SELECT pg_stat_statements_reset();`,
            })
            handleRefresh()
            setShowResetgPgStatStatements(false)
          } catch (error: any) {
            toast.error(`Failed to reset analysis: ${error.message}`)
          }
        }}
      />
    </>
  )
}
