import React from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { LogsLayout } from 'components/layouts'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      // @ts-ignore
      tableName={'postgres_logs'}
      queryType={'database'}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Database">{page}</LogsLayout>

export default observer(LogPage)
