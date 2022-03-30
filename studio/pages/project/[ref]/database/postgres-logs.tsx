import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts/'
import { LogsTableName } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'

export const LogPage: NextPage = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <DatabaseLayout>
      <LogsPreviewer
        projectRef={ref as string}
        condensedLayout={true}
        // @ts-ignore
        tableName={'postgres_logs'}
        queryType={'database'}
      />
    </DatabaseLayout>
  )
}

export default withAuth(observer(LogPage))
