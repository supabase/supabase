import React from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { DatabaseLayout } from 'components/layouts'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { NextPageWithLayout } from 'types'
import { LogsTableName } from 'components/interfaces/Settings/Logs'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={LogsTableName.POSTGREST}
      queryType="postgrest"
    />
  )
}

LogPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(LogPage)
