import useSWR, { KeyLoader } from 'swr'
import debounce from 'lodash/debounce'
import { useEffect, useRef, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Typography, IconLoader, IconAlertCircle, IconRewind, Button } from '@supabase/ui'

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
  LogData,
} from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'
import useSWRInfinite from 'swr/infinite'
import { isUndefined } from 'lodash'
import Flag from 'components/ui/Flag/Flag'

/**
 * Acts as a container component for the entire log display
 *
 *
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
  const [params, setParams] = useState({
    type: '',
    search_query: '',
    where: '',
    timestamp_start: '',
    timestamp_end: '',
  })
  const title = `Logs - ${LOG_TYPE_LABEL_MAPPING[type as string]}`
  const debouncedQueryParams = useRef(debounce(setQueryParams, 600)).current

  useEffect(() => {
    const qs = genQueryParams(params)
    debouncedQueryParams(qs)
    return () => debouncedQueryParams.cancel()
  }, [mode, search, where, type])

  const genQueryParams = (params: { [k: string]: string }) => {
    // remove keys which are empty strings, null, or undefined
    for (const k in params) {
      const v = params[k]
      if (v === null || v === '' || isUndefined(v)) {
        delete params[k]
      }
    }
    const qs = new URLSearchParams(params).toString()
    return qs
  }
  // handle log fetching
  const getKeyLogs: KeyLoader<Logs> = (_pageIndex: number, prevPageData) => {
    let queryParams
    // if prev page data is 100 items, could possibly have more records that are not yet fetched within this interval
    if (prevPageData === null) {
      // reduce interval window limit by using the timestamp of the last log
      queryParams = genQueryParams(params)
    } else {
      const len = prevPageData.data.length
      const { timestamp: tsLimit }: LogData = prevPageData.data[len - 1]
      // create new key from params
      queryParams = genQueryParams({ ...params, timestamp_end: String(tsLimit) })
    }

    const logUrl = `${API_URL}/projects/${ref}/logs?${queryParams}`
    return logUrl
  }
  const {
    data = [],
    isValidating,
    mutate,
    size,
    setSize,
  } = useSWRInfinite<Logs>(getKeyLogs, get, { revalidateOnFocus: false })

  // const { data, isValidating, mutate } = useSWR<Logs>(logUrl, get, { revalidateOnFocus: false })
  let logData: LogData[] = []
  let error: null | string = null

  data.forEach((response: Logs) => {
    if (response && response.data) {
      logData = [...logData, ...response.data]
    }
    if (!error && response && response.error) {
      error = response.error
    }
  })

  const countUrl = `${API_URL}/projects/${ref}/logs?${genQueryParams({
    ...params,
    count: String(true),
    period_start: String(latestRefresh),
  })}`
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
          {/* Footer section of log ui, appears below table */}
          <div className="p-2">
            <Flag name="logsLoadOlder">
              <Button
                // trigger page increase
                onClick={() => setSize(size + 1)}
                icon={<IconRewind />}
                type="secondary"
              >
                Load older
              </Button>
            </Flag>
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))
