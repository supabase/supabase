import useSWR from 'swr'
import React, { useEffect, useState } from 'react'
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
  Input,
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
  genDefaultQuery,
  genCountQuery,
} from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite'
import { isUndefined } from 'lodash'
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
    timestamp_start: '',
    timestamp_end: '',
  })
  const title = `Logs - ${LOG_TYPE_LABEL_MAPPING[type as keyof typeof LOG_TYPE_LABEL_MAPPING]}`
  const checkIfSelectQuery = (value: string) =>
    value.toLowerCase().includes('select') ? true : false
  const table = type === 'api' ? 'edge_logs' : 'postgres_logs'
  useEffect(() => {
    setParams({ ...params, type: type as string })
  }, [type])

  useEffect(() => {
    // on mount, set initial values
    if (q !== undefined && q !== '') {
      onSelectTemplate({
        mode: 'custom',
        searchString: q as string,
      })
    } else {
      onSelectTemplate({
        mode: 'simple',
        searchString: (s || '') as string,
      })
    }
    if (te) {
      setParams((prev) => ({ ...prev, timestamp_end: te as string }))
    } else {
      setParams((prev) => ({ ...prev, timestamp_end: '' }))
    }
  }, [q, s, te])

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
  const getKeyLogs: SWRInfiniteKeyLoader = (_pageIndex: number, prevPageData: Logs) => {
    let queryParams
    // if prev page data is 100 items, could possibly have more records that are not yet fetched within this interval
    if (prevPageData === null) {
      // reduce interval window limit by using the timestamp of the last log
      queryParams = genQueryParams(params)
    } else if ((prevPageData.result ?? []).length === 0) {
      // no rows returned, indicates that no more data to retrieve and append.
      return null
    } else {
      const len = prevPageData.result.length
      const { timestamp: tsLimit }: LogData = prevPageData.result[len - 1]
      // create new key from params
      queryParams = genQueryParams({ ...params, timestamp_end: String(tsLimit) })
    }

    const logUrl = `${API_URL}/projects/${ref}/analytics/endpoints/logs.${type}?${queryParams}`
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
  let error: null | string | object = swrError ? swrError.message : null
  data.forEach((response) => {
    if (!error && response?.result) {
      logData = [...logData, ...response.result]
    }
    if (!error && response && response.error) {
      error = response.error
    }
  })

  const countUrl = `${API_URL}/projects/${ref}/analytics/endpoints/logs.${type}?${genQueryParams({
    ...params,
    sql: genCountQuery(table),
    period_start: String(latestRefresh),
  })}`
  const { data: countData } = useSWR<Count>(countUrl, get, { refreshInterval: 5000 })
  const newCount = countData?.result?.[0]?.count ?? 0

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
      onSelectTemplate({
        mode: 'custom',
        searchString: genDefaultQuery(table),
      })
    } else {
      setMode('simple')
    }
  }

  const onSelectTemplate = (template: LogTemplate) => {
    setMode(template.mode)
    if (template.mode === 'simple') {
      setParams((prev) => ({ ...prev, search_query: template.searchString, sql: '' }))
    } else {
      setEditorValue(template.searchString)
      setParams((prev) => ({
        ...prev,
        sql: template.searchString,
        search_query: '',
        timestamp_end: '',
      }))
      setEditorId(uuidv4())
    }
  }
  const handleEditorSubmit = () => {
    setParams((prev) => ({ ...prev, sql: editorValue, search_query: '' }))
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
      sql: '',
    }))
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
              {mode === 'custom' && (
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
                <Button
                  type="text"
                  onClick={() => {
                    setEditorValue(genDefaultQuery(table))
                    setEditorId(uuidv4())
                  }}
                >
                  Reset
                </Button>
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
                'absolute top-0 w-full h-full flex items-center justify-center',
                'bg-gray-100 opacity-75 z-50',
              ].join(' ')}
            >
              <IconLoader className="animate-spin" />
            </div>
          )}

          <LogTable data={logData} isCustomQuery={mode === 'custom'} />
          <div className="p-2">
            {mode === 'simple' && (
              <Button onClick={() => setSize(size + 1)} icon={<IconRewind />} type="default">
                Load older
              </Button>
            )}
          </div>

          {error && (
            <div className="flex w-full h-full justify-center items-center mx-auto">
              <Card className="flex flex-col gap-y-2  w-2/5 bg-scale-400">
                <div className="flex flex-row gap-x-2 py-2">
                  <IconAlertCircle size={16} />
                  <Typography.Text type="secondary">
                    Sorry! An error occured when fetching data.
                  </Typography.Text>
                </div>
                <Input.TextArea
                  label="Error Messages"
                  value={JSON.stringify(error, null, 2)}
                  borderless
                  className=" border-t-2 border-scale-800 pt-2 font-mono"
                />
              </Card>
            </div>
          )}
        </div>
      </div>
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))
