import React, { useEffect, useState } from 'react'
import { SettingsLayout } from 'components/layouts'
import { useRouter } from 'next/router'
import LogPanel from 'components/ui/Logs/LogPanel'
import { LOG_TYPE_LABEL_MAPPING } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { get } from "lib/common/fetch"
import LogTable, { LogData } from 'components/ui/Logs/LogTable'
import useSWR from 'swr'
import { API_URL } from 'lib/constants'
import { Typography, Input } from '@supabase/ui'

/**
 * Acts as a container component for the entire log display
 */
const LogPage = () => {
  const router = useRouter()
  const { ref, type } = router.query
  const title = LOG_TYPE_LABEL_MAPPING[type as string]
  const [searchQuery, setSearchQuery] = useState("")

  // handle log fetching
  const {
    data,
    isValidating: isLoading,
    mutate,
  } = useSWR<{ data: LogData[], count: number, error: any }>(`${API_URL}/projects/${ref}/logs?type=${type}`, get, {
    revalidateOnFocus: false,
  })
  console.log(data)
  const { data: logData, error } = data || {}

  const filteredData = logData && searchQuery ? logData.filter(d => {
    return d.event_message.toLowerCase().includes(searchQuery.toLowerCase())
  }) : logData
  return (
    <SettingsLayout title={title} className="p-4">
      <LogPanel isLoading={isLoading} onRefresh={() => mutate()} />

      <div className="flex flex-row justify-end p-4">
        <Input className="max-w-32" placeholder="Search" onChange={e => setSearchQuery(e.target.value)} value={searchQuery} />
      </div>
      {error && (<Typography.Text className="text-center w-full block">Could not fetch data</Typography.Text>)}
      <LogTable data={filteredData} />
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))