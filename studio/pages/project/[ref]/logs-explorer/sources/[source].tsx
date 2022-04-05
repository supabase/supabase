import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { LogsExplorerLayout } from 'components/layouts/'
import { LogsTableName } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'

export const LogPage: NextPage = () => {
  const router = useRouter()
  const { ref, source } = router.query

  // quick fix to get correct queryType
  const queryType = {
    edge_logs: 'api',
    postgres_logs: 'database',
    function_logs: 'functions',
    function_edge_logs: 'fn_edge',
  }

  return (
    <LogsExplorerLayout subtitle={<span className="font-mono">{source}</span>}>
      <LogsPreviewer
        projectRef={ref as string}
        condensedLayout={false}
        tableName={source as LogsTableName}
        // @ts-ignore
        queryType={queryType[source]}
      />
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogPage))
