import React, { useEffect, useRef, useState } from 'react'
import { SettingsLayout } from 'components/layouts/'
import { useRouter } from 'next/router'
import LogPanel from 'components/ui/Logs/LogPanel'
import { LOG_TYPE_LABEL_MAPPING } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { get } from 'lib/common/fetch'
import LogTable, { LogData } from 'components/ui/Logs/LogTable'
import useSWR from 'swr'
import { API_URL } from 'lib/constants'
import { Typography, Button } from '@supabase/ui'
import debounce from 'lodash/debounce'
import CodeEditor from 'components/ui/CodeEditor'
import { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'

interface CountData {
  count: number
}
/**
 * Acts as a container component for the entire log display
 */
export const LogPage = () => {
  const router = useRouter()
  const { ref, type } = router.query

  const [search, setSearch] = useState<string>('')
  const [queryParams, setQueryParams] = useState<string>('')
  const [where, setWhere] = useState<string>('')
  const [mode, setMode] = useState<'simple' | 'custom'>('simple')
  const [latestRefresh, setLatestRefresh] = useState<string>(new Date().toISOString())

  const title = LOG_TYPE_LABEL_MAPPING[type as string]

  // handle log fetching
  const {
    data,
    isValidating: isLoading,
    mutate,
  } = useSWR<{ data: LogData[]; count: number; error: any }>(
    `${API_URL}/projects/${ref}/logs?${queryParams}`,
    get,
    {
      revalidateOnFocus: false,
    }
  )

  const debouncedQueryParams = useRef(debounce(setQueryParams, 600)).current

  useEffect(() => {
    const params = {
      type: type as string,
      search_query: search || '',
      where: where || '',
    }
    const qs = new URLSearchParams(params).toString()
    debouncedQueryParams(qs)
    return () => debouncedQueryParams.cancel()
  }, [search, where, type])

  const countKey = `${API_URL}/projects/${ref}/logs?${queryParams}&count=true&period_start=${latestRefresh}`
  const { data: countData } = useSWR<{ data: [CountData] | []; error?: any }>(countKey, get, {
    refreshInterval: 5000,
  })
  const newCount = countData?.data?.[0]?.count
  const { data: logData, error } = data || {}

  const handleRefresh = () => {
    setLatestRefresh(new Date().toISOString())
    mutate()
  }
  const handleModeToggle = () => {
    if (mode === 'simple') {
      setMode('custom')
      setSearch('')
    } else {
      setMode('simple')
    }
  }
  return (
    <SettingsLayout title={title} className="p-4 space-y-4">
      <LogPanel
        showReset={(where || search) ? true : false}
        onReset={() => {
          setWhere('')
          setSearch('')
          setMode('simple') // this is necessary to reset the value of the monaco editor
        }}
        templates={[
          { label: "Recent Errors", onClick: () => setSearch('[Ee]rror|\\s[45][0-9][0-9]\\s') },
          { label: "POST or PATCH", onClick: () => {
            setSearch('')
            setMode('custom')
            setWhere("REGEXP_CONTAINS(event_message, 'POST') OR REGEXP_CONTAINS(event_message, 'PATCH') ")
          } },
        ]}
        searchValue={search}
        onCustomClick={handleModeToggle} isLoading={isLoading} onRefresh={handleRefresh} onSearch={setSearch} />
      {mode === 'custom' &&
        <div>
          <CodeEditor
            className="p-4 h-24"
            hideLineNumbers
            id={'logs-where-editor'}
            language="pgsql"
            defaultValue={where}
            onInputChange={(v) => setWhere(v || '')}
            onInputRun={handleRefresh}
          />
        </div>}
      {error && (
        <Typography.Text className="text-center w-full block">Could not fetch data</Typography.Text>
      )}
      {newCount && <LoadNewLogsButton onClick={handleRefresh} />}
      <LogTable data={logData} />
    </SettingsLayout>
  )
}

const LoadNewLogsButton = (props: ButtonProps) => <Button type="dashed" block {...props}>Load new logs</Button>

export default withAuth(observer(LogPage))
