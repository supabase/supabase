import React, { useCallback, useEffect, useState } from 'react'
import { SettingsLayout } from 'components/layouts/'
import { useRouter } from 'next/router'
import LogPanel from 'components/ui/Logs/LogPanel'
import { LOG_TYPE_LABEL_MAPPING } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { get } from "lib/common/fetch"
import LogTable, { LogData } from 'components/ui/Logs/LogTable'
import useSWR from 'swr'
import { API_URL } from 'lib/constants'
import { Typography, Input, Button } from '@supabase/ui'
import debounce from 'lodash/debounce'

interface CountData {
  count: number
}
/**
 * Acts as a container component for the entire log display
 */
export const LogPage = () => {
  const router = useRouter()
  const { ref, type } = router.query
  const title = LOG_TYPE_LABEL_MAPPING[type as string]
  const [search, setSearch] = useState("")
  const [queryParams, setQueryParams] = useState("")
  const [latestRefresh, setLatestRefresh] = useState(new Date().toISOString())

  // handle log fetching
  const {
    data,
    isValidating: isLoading,
    mutate,
  } = useSWR<{ data: LogData[], count: number, error: any }>(`${API_URL}/projects/${ref}/logs?${queryParams}`, get, {
    revalidateOnFocus: false,
  })
  const debouncedSearch = debounce(setSearch, 500)

  useEffect(() => {
    const params = {
      search_query: search,
      path: `/${type}`
    }
    const qs = new URLSearchParams(params).toString()
    setQueryParams(qs)
  }, [search])

  const countKey = `${API_URL}/projects/${ref}/logs?${queryParams}&count=true&period_start=${latestRefresh}`
  const {
    data: countData,
    mutate: mutateCount
  } = useSWR<{ data: [CountData] | [], error?: any }>(countKey, get, {
    refreshInterval: 5000
  })
  const newCount = countData?.data[0]?.count
  const { data: logData, error } = data || {}

  const handleRefresh = () => {
    setLatestRefresh(new Date().toISOString())
    mutate()
  }
  return (
    <SettingsLayout title={title} className="p-4">
      <LogPanel isLoading={isLoading} onRefresh={handleRefresh} onSearch={debouncedSearch} />
      {error && (<Typography.Text className="text-center w-full block">Could not fetch data</Typography.Text>)}
      {newCount && newCount > 0 && <Button onClick={handleRefresh}>Load new logs</Button>}
      <LogTable data={logData} />
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))