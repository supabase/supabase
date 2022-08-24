import React from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import { NextPageWithLayout } from 'types'

/**
 * Placeholder page for logs previewers until we figure out where to slot them
 */
export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = router.query

  return (
    <LogsPreviewer
      projectRef={ref as string}
      queryType={'functions'}
      filterOverride={{ 'metadata.function_id': id }}
    />
  )
}

LogPage.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(LogPage)
