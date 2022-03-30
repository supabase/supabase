import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { LOG_TYPE_LABEL_MAPPING } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import FunctionsLayout from 'components/interfaces/Functions/FunctionsLayout'

/**
 * Placeholder page for logs previewers until we figure out where to slot them
 */
export const LogPage: NextPage = () => {
  const router = useRouter()
  const { ref, type, id } = router.query

  const title = `Invocation Logs - ${
    LOG_TYPE_LABEL_MAPPING[type as keyof typeof LOG_TYPE_LABEL_MAPPING]
  }`

  return (
    <FunctionsLayout title={title}>
      <LogsPreviewer
        projectRef={ref as string}
        queryType={'fn_edge'}
        override={{ key: 'function_id', value: id }}
      />
    </FunctionsLayout>
  )
}

export default withAuth(observer(LogPage))
