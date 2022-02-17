import useSWR, { KeyLoader } from 'swr'
import React, { useEffect, useRef, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import {
  Typography,
  IconLoader,
  IconAlertCircle,
  IconRewind,
  Button,
  IconInfo,
  Card,
} from '@supabase/ui'

import { withAuth } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { SettingsLayout } from 'components/layouts/'
import CodeEditor from 'components/ui/CodeEditor'
import {
  LogPanel,
  LogTable,
  LogEventChart,
  Count,
  Logs,
  LogTemplate,
  TEMPLATES,
  LogData,
  LogSearchCallback,
  LOG_TYPE_LABEL_MAPPING,
} from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite'
import { isUndefined } from 'lodash'
import { useFlag } from 'hooks'
import dayjs from 'dayjs'
import InformationBox from 'components/ui/InformationBox'

/**
 * Acts as a container component for the entire log display
 *
 * ## Query Params Syncing
 * Query params are synced on query submission.
 *
 * params used are:
 * - `q` for the editor query.
 * - `s` for search query.
 * - `te` for timestamp start value.
 */
export const LogPage: NextPage = () => {
  const logsQueryParamsSyncing = useFlag('logsQueryParamsSyncing')
  const router = useRouter()
  const { ref, type, q, s, te } = router.query
  const [editorId, setEditorId] = useState<string>(uuidv4())
  const [editorValue, setEditorValue] = useState('')
  const [showChart, setShowChart] = useState(true)
  const [mode, setMode] = useState<'simple' | 'custom'>('simple')
  const [latestRefresh, setLatestRefresh] = useState<string>(new Date().toISOString())
  const [params, setParams] = useState({
    type: '',
    search_query: '',
    sql: '',
    where: '',
    timestamp_start: '',
    timestamp_end: '',
  })
  const title = `Logs - ${LOG_TYPE_LABEL_MAPPING[type as keyof typeof LOG_TYPE_LABEL_MAPPING]}`
  const checkIfSelectQuery = (value: string) =>
    value.toLowerCase().includes('select') ? true : false
  const isSelectQuery = checkIfSelectQuery(editorValue)

  useEffect(() => {
    setParams({ ...params, type: type as string })
  }, [type])

  useEffect(() => {
    if (!logsQueryParamsSyncing) return
    // on mount, set initial values
    if (q) {
      onSelectTemplate({
        mode: 'custom',
        searchString: q as string,
      })
    } else if (s) {
      onSelectTemplate({
        mode: 'simple',
        searchString: s as string,
      })
    }
    if (te) {
      setParams((prev) => ({ ...prev, timestamp_end: te as string }))
    } else {
      setParams((prev) => ({ ...prev, timestamp_end: '' }))
    }
  }, [logsQueryParamsSyncing])

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
  const getKeyLogs: SWRInfiniteKeyLoader = (_pageIndex: number, prevPageData) => {
    let queryParams
    // if prev page data is 100 items, could possibly have more records that are not yet fetched within this interval
    if (prevPageData === null) {
      // reduce interval window limit by using the timestamp of the last log
      queryParams = genQueryParams(params)
    } else if ((prevPageData?.data ?? []).length === 0) {
      // no rows returned, indicates that no more data to retrieve and append.
      return null
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
    error: swrError,
    isValidating,
    mutate,
    size,
    setSize,
  } = useSWRInfinite<Logs>(getKeyLogs, get, { revalidateOnFocus: false })
  let logData: LogData[] = []
  let error: null | string = swrError ? swrError.message : null
  data.forEach((response: Logs) => {
    if (!error && response && response.data) {
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

  const handleRefresh = () => {
    setLatestRefresh(new Date().toISOString())
    setParams({ ...params, timestamp_end: '' })
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        te: undefined,
      },
    })
    setSize(1)
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
      setParams((prev) => ({ ...prev, search_query: template.searchString, sql: '', where: '' }))
    } else {
      setEditorValue(template.searchString)
      setParams((prev) => ({
        ...prev,
        where: checkIfSelectQuery(template.searchString)
          ? ''
          : cleanEditorValue(template.searchString),
        sql: checkIfSelectQuery(template.searchString)
          ? cleanEditorValue(template.searchString)
          : '',
        search_query: '',
        timestamp_end: '',
      }))
      setEditorId(uuidv4())
    }
  }
  const handleEditorSubmit = () => {
    setParams((prev) => ({
      ...prev,
      where: isSelectQuery ? '' : cleanEditorValue(editorValue),
      sql: isSelectQuery ? cleanEditorValue(editorValue) : '',
      search_query: '',
    }))
    if (!logsQueryParamsSyncing) return
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        q: editorValue,
        s: undefined,
        te: undefined,
      },
    })
  }
  const handleSearch: LogSearchCallback = ({ query, from, fromMicro }) => {
    const unixMicro = fromMicro ? fromMicro : dayjs(from).valueOf() * 1000
    setParams((prev) => ({
      ...prev,
      search_query: query || '',
      timestamp_end: unixMicro ? String(unixMicro) : '',
      where: '',
      sql: '',
    }))
    if (!logsQueryParamsSyncing) return
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        q: undefined,
        s: query || '',
        te: unixMicro,
      },
    })
    setEditorValue('')
  }
  const cleanEditorValue = (value: string) => {
    if (typeof value !== 'string') return value
    return value.replace(/\n/g, ' ')
  }
  return (
    <SettingsLayout title={title}>
      <div className="h-full flex flex-col flex-grow">
        <LogPanel
          isShowingEventChart={showChart}
          onToggleEventChart={() => setShowChart(!showChart)}
          isCustomQuery={mode === 'custom'}
          isLoading={isValidating}
          newCount={newCount}
          templates={TEMPLATES.filter((template) => template.for?.includes(type as string))}
          onRefresh={handleRefresh}
          onSearch={handleSearch}
          defaultSearchValue={params.search_query}
          defaultFromValue={
            params.timestamp_end ? dayjs(Number(params.timestamp_end) / 1000).toISOString() : ''
          }
          onCustomClick={handleModeToggle}
          onSelectTemplate={onSelectTemplate}
        />
        {mode === 'custom' && (
          <React.Fragment>
            <div className="min-h-[7rem] h-28">
              <CodeEditor
                id={editorId}
                language="pgsql"
                defaultValue={editorValue}
                onInputChange={(v) => setEditorValue(v || '')}
                onInputRun={handleRefresh}
              />
            </div>
            <div className="flex flex-row justify-end items-center px-2 py-1 w-full">
              {isSelectQuery && (
                <InformationBox
                className="shrink mr-auto"
                  block={false}
                  size="tiny"
                  icon={<IconInfo size="tiny" />}
                  title={`Custom queries are restricted to a ${
                    type === 'database' ? '2 hour' : '7 day'
                  } querying window.`}
                />
              )}
              <div className="flex flex-row gap-x-2 justify-end p-2">
                {editorValue && (
                  <Button
                    type="text"
                    onClick={() => {
                      setEditorValue('')
                      setEditorId(uuidv4())
                    }}
                  >
                    Clear
                  </Button>
                )}
                <Button type={editorValue ? 'secondary' : 'text'} onClick={handleEditorSubmit}>
                  Run
                </Button>
              </div>
            </div>
          </React.Fragment>
        )}
        {showChart && mode !== 'custom' && (
          <div>
            <LogEventChart
              data={!isValidating ? logData : undefined}
              onBarClick={(timestampMicro) => {
                handleSearch({ query: params.search_query, fromMicro: timestampMicro })
              }}
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
            <div className="flex w-full h-full justify-center items-center mx-auto">
              <Card className="flex flex-col gap-y-2  w-1/3">
                <div className="flex flex-row gap-x-2 py-2">
                  <IconAlertCircle size={16} />
                  <Typography.Text type="secondary">
                    Sorry! An error occured when fetching data.
                  </Typography.Text>
                </div>
                <details className="cursor-pointer">
                  <summary>
                    <Typography.Text type="secondary">Error Message</Typography.Text>
                  </summary>
                  <Typography.Text className="block whitespace-pre-wrap" small code type="warning">
                    {JSON.stringify(error, null, 2)}
                  </Typography.Text>
                </details>
              </Card>
            </div>
          )}
          <LogTable data={logData} isCustomQuery={mode === 'custom'} />
          {/* Footer section of log ui, appears below table */}
          <div className="p-2">
            {!isSelectQuery && (
              <Button
                // trigger page increase
                onClick={() => setSize(size + 1)}
                icon={<IconRewind />}
                type="secondary"
              >
                Load older
              </Button>
            )}
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))
