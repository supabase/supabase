import useSWR from 'swr'
import debounce from 'lodash/debounce'
import { useEffect, useRef, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Typography, IconLoader, IconAlertCircle } from '@supabase/ui'

import { withAuth } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, LOG_TYPE_LABEL_MAPPING } from 'lib/constants'
import { SettingsLayout } from 'components/layouts/'
import CodeEditor from 'components/ui/CodeEditor'
import {
  LogPanel,
  LogTable,
  Count,
  Logs,
  LogTemplate,
  TEMPLATES,
} from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'

/**
 * Acts as a container component for the entire log display
 */
export const LogPage: NextPage = () => {
  const router = useRouter()
  const { ref, type } = router.query

  const [editorId, setEditorId] = useState<string>(uuidv4())
  const [search, setSearch] = useState<string>('')
  const [queryParams, setQueryParams] = useState<string>('')
  const [where, setWhere] = useState<string>('')
  const [mode, setMode] = useState<'simple' | 'custom'>('simple')
  const [latestRefresh, setLatestRefresh] = useState<string>(new Date().toISOString())

  const title = `Logs - ${LOG_TYPE_LABEL_MAPPING[type as string]}`
  const debouncedQueryParams = useRef(debounce(setQueryParams, 600)).current

  useEffect(() => {
    const params = {
      type: type as string,
      search_query: search || '',
      where: mode === 'custom' ? where || '' : '',
    }
    const qs = new URLSearchParams(params).toString()
    debouncedQueryParams(qs)
    return () => debouncedQueryParams.cancel()
  }, [mode, search, where, type])

  // handle log fetching
  const logUrl = `${API_URL}/projects/${ref}/logs?${queryParams}`
  const { data, isValidating, mutate } = useSWR<Logs>(logUrl, get, { revalidateOnFocus: false })
  const { data: logData, error } = data || {}

  const countUrl = `${API_URL}/projects/${ref}/logs?${queryParams}&count=true&period_start=${latestRefresh}`
  const { data: countData } = useSWR<Count>(countUrl, get, { refreshInterval: 5000 })
  const newCount = countData?.data?.[0]?.count ?? 0

  const handleReset = () => {
    setWhere('')
    setSearch('')
    setEditorId(uuidv4())
  }

  const handleRefresh = () => {
    setLatestRefresh(new Date().toISOString())
    mutate()
  }

  const handleModeToggle = () => {
    if (mode === 'simple') {
      setMode('custom')
      // setWhere(DEFAULT_QUERY)
    } else {
      setMode('simple')
    }
  }

  const onSelectTemplate = (template: LogTemplate) => {
    setMode(template.mode)
    if (template.mode === 'simple') {
      setSearch(template.searchString)
      setWhere('')
    } else {
      setWhere(template.searchString)
      setSearch('')
      setEditorId(uuidv4())
    }
  }

  return (
    <SettingsLayout title={title}>
      <div className="h-full flex flex-col flex-grow">
        <LogPanel
          isCustomQuery={mode === 'custom'}
          isLoading={isValidating}
          newCount={newCount}
          showReset={search.length > 0}
          searchValue={search}
          templates={TEMPLATES}
          onReset={handleReset}
          onRefresh={handleRefresh}
          onSearch={setSearch}
          onCustomClick={handleModeToggle}
          onSelectTemplate={onSelectTemplate}
        />
        {mode === 'custom' && (
          <div className="min-h-[7rem] h-28">
            <CodeEditor
              id={editorId}
              language="pgsql"
              defaultValue={where}
              onInputChange={(v) => setWhere(v || '')}
              onInputRun={handleRefresh}
            />
          </div>
        )}
        <div className="flex flex-col flex-grow relative">
          {isValidating && (
            <div
              className={[
                'absolute top-0 w-full h-full bg-gray-800 flex items-center justify-center',
                `${isValidating ? 'bg-opacity-75 z-50' : ''}`,
              ].join(' ')}
            >
              <IconLoader className="animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex w-full h-full justify-center items-center space-x-2 mx-auto">
              <IconAlertCircle size={16} />
              <Typography.Text type="secondary">Sorry! Could not fetch data</Typography.Text>
            </div>
          )}
          <LogTable data={logData} isCustomQuery={mode === 'custom'} />
        </div>
      </div>
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))
