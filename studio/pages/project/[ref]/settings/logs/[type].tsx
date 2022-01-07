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
import { useFlag } from 'hooks'

/**
 * Acts as a container component for the entire log display
 *
 *
 */
export const LogPage: NextPage = () => {
  const logsCustomSql = useFlag('logsCustomSql')
  const router = useRouter()
  const { ref, type } = router.query

  const [editorId, setEditorId] = useState<string>(uuidv4())
  const [editorValue, setEditorValue] = useState('')
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
  const title = `Logs - ${LOG_TYPE_LABEL_MAPPING[type as string]}`
  const isSelectQuery = logsCustomSql && editorValue.toLowerCase().includes('select') ? true : false

  useEffect(() => {
    setParams({ ...params, type: type as string })
  }, [type])

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
    } else if (prevPageData.data.length === 0) {
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
        where: isSelectQuery ? '' : template.searchString,
        sql: isSelectQuery ? template.searchString : '',
        search_query: '',
      }))
      setEditorId(uuidv4())
    }
  }
  const handleEditorSubmit = () => {
    setParams((prev) => ({
      ...prev,
      where: isSelectQuery ? '' : editorValue,
      sql: isSelectQuery ? editorValue : '',
    }))
  }
  const handleSearch = (v: string) => {
    setParams((prev) => ({ ...prev, search_query: v || '' }))
  }

  return (
    <SettingsLayout title={title}>
      <div className="h-full flex flex-col flex-grow">
        <LogPanel
          isCustomQuery={mode === 'custom'}
          isLoading={isValidating}
          newCount={newCount}
          templates={TEMPLATES}
          onRefresh={handleRefresh}
          onSearch={handleSearch}
          defaultSearchValue={params.search_query}
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
            <div className="flex flex-row justify-end p-2 w-full">
              <Flag name="logsCustomSql">
                {isSelectQuery && (
                  <div className="flex flex-grow flex-row items-center gap-x-1">
                    {/* // we don't have a slim Alert component yet */}
                    <IconInfo size="tiny" />
                    <Typography.Text small={true} type="secondary">
                      Custom queries are restricted to a {type === 'database' ? '2 hour' : '7 day'}{' '}
                      querying window.
                    </Typography.Text>
                  </div>
                )}
              </Flag>
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
              <Card className="flex flex-col gap-y-2">
                <div className="flex flex-row gap-x-2 py-2">
                  <IconAlertCircle size={16} />
                  <Typography.Text type="secondary">
                    Sorry! An error occured when fetching data.
                  </Typography.Text>
                </div>
                <Typography.Text type="warning">{error}</Typography.Text>
              </Card>
            </div>
          )}
          <LogTable data={logData} isCustomQuery={mode === 'custom'} />
          {/* Footer section of log ui, appears below table */}
          <div className="p-2">
            {!isSelectQuery && (
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
            )}
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))
