// import React, { useState } from 'react'
// import { NextPage } from 'next'
// import { withAuth } from 'hooks'

// import { observer } from 'mobx-react-lite'

// // import LogWrapper from 'components/interfaces/Settings/Logs/LogWrapper'

// import { Button, Toggle } from '@supabase/ui'
// import { QueryType, Mode } from 'components/interfaces/Settings/Logs'
// import FunctionLayout from '../interfaces/FunctionLayout'

// export const LogPage: NextPage = () => {
//   // ! custom is SQL only logging !

//   return (
//     <>
//       <FunctionLayout>{/* <LogWrapper type={'fn_edge'} mode={'simple'} /> */}</FunctionLayout>
//     </>
//   )
// }

// export default withAuth(observer(LogPage))

import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { SettingsLayout } from 'components/layouts/'
import { LOG_TYPE_LABEL_MAPPING, QueryType } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import FunctionLayout from '../interfaces/FunctionLayout'

/**
 * Placeholder page for logs previewers until we figure out where to slot them
 */
export const LogPage: NextPage = () => {
  const router = useRouter()
  const { ref, type } = router.query

  const title = `Logs - ${LOG_TYPE_LABEL_MAPPING[type as keyof typeof LOG_TYPE_LABEL_MAPPING]}`

  return (
    <FunctionLayout title={title}>
      <LogsPreviewer projectRef={ref as string} queryType={'fn_edge'} />
    </FunctionLayout>
  )
}

export default withAuth(observer(LogPage))
