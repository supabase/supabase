import React, { useEffect, useState } from 'react'
import { SettingsLayout } from 'components/layouts'
import { useRouter } from 'next/router'
import LogPanel from 'components/ui/Logs/LogPanel'
import { LOG_TYPE_LABEL_MAPPING } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { get } from "lib/common/fetch"
import LogTable from 'components/ui/Logs/LogTable'
import useSWR from 'swr'
import { API_URL } from 'lib/constants'
import { Typography } from '@supabase/ui'

interface LogsResponse {
  data: any
  error: any
}
/**
 * Acts as a container component for the entire log display
 */
const LogPage = () => {
  const router = useRouter()
  const { ref, type } = router.query
  const title = LOG_TYPE_LABEL_MAPPING[type as string]

  // handle log fetching
  const {
    data,
    isValidating: isLoading,
    mutate,
  } = useSWR<{ data: LogsResponse, error: any }>(`${API_URL}/projects/${ref}/logs?type=${type}`, get)

  const { data: logData, error } = data || {}
  return (
    <SettingsLayout title={title} className="p-4">
      <LogPanel isLoading={isLoading} onRefresh={() => mutate()} />
      {error && (<Typography.Text className="text-center w-full block">Could not fetch data</Typography.Text>)}
      <LogTable data={logData} />
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))