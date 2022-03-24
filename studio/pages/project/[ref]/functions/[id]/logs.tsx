import React, { useState } from 'react'
import { NextPage } from 'next'
import { withAuth } from 'hooks'

import { observer } from 'mobx-react-lite'

// import LogWrapper from 'components/interfaces/Settings/Logs/LogWrapper'

import { Button, Toggle } from '@supabase/ui'
import { QueryType, Mode } from 'components/interfaces/Settings/Logs'
import FunctionLayout from '../interfaces/FunctionLayout'

export const LogPage: NextPage = () => {
  // ! custom is SQL only logging !

  return (
    <>
      <FunctionLayout>{/* <LogWrapper type={'functions'} mode={'simple'} /> */}</FunctionLayout>
    </>
  )
}

export default withAuth(observer(LogPage))
