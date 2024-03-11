import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { executeSql } from 'data/sql/execute-sql-query'
import type { NextPageWithLayout } from 'types'
import { lint_sql } from './lints.utils'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()

  useEffect(() => {
    let cancel = false

    const loadLints = async () => {
      if (!cancel) {
        // setFetchingSchemaInfo(true)
        // setDefaultSchema(undefined)
      }
      try {
        const res = await executeSql({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          sql: lint_sql,
        })
        console.log({ res })
        //if (!cancel) setDefaultSchema(res.result[0].schema)
      } catch (error) {}
    }
    loadLints()

    return () => {
      cancel = true
    }
  }, [])

  const handleRefresh = async () => {
    console.log('refresh')
  }

  const headerText = (
    <p className="whitespace-pre-wrap prose text-sm max-w-2xl text-foreground-light">
      Queries to identify common database schema issues
    </p>
  )

  const panelClassNames = 'text-sm max-w-none flex flex-col gap-8 py-4'

  return (
    <div className="p-4 py-3">
      <ReportHeader title="Project lints" isLoading={false} onRefresh={handleRefresh} />

      {headerText}

      <div className="flex flex-col">
        <div className={panelClassNames}>
          <div className="thin-scrollbars max-w-full overflow-auto min-h-[800px]">
            content in here
          </div>
        </div>
      </div>
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <ReportsLayout title="Query performance">{page}</ReportsLayout>
)

export default QueryPerformanceReport
