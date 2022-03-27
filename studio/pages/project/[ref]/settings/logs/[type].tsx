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
  LogsTableName,
} from 'components/interfaces/Settings/Logs'
import { uuidv4 } from 'lib/helpers'
import useSWRInfinite, { SWRInfiniteKeyLoader } from 'swr/infinite'
import { isUndefined } from 'lodash'
import dayjs from 'dayjs'
import InformationBox from 'components/ui/InformationBox'
import useLogsPreview from 'hooks/analytics/useLogsPreview'

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
  const { ref, type, s, te, ts } = router.query
  const [showChart, setShowChart] = useState(true)
  const table = type === 'api' ? LogsTableName.EDGE : LogsTableName.POSTGRES

  const [
    { error, logData, params, newCount, filters, isLoading, oldestTimestamp },
    { loadOlder, setFilters, refresh, setTo, setFrom },
  ] = useLogsPreview(ref as string, table, {
    initialFilters: { search_query: s as string },
    whereStatementFactory: (filterObj) =>
      `${
        filterObj.search_query ? `REGEXP_CONTAINS(event_message, '${filterObj.search_query}')` : ''
      }`,
  })

  const title = `Logs - ${LOG_TYPE_LABEL_MAPPING[type as keyof typeof LOG_TYPE_LABEL_MAPPING]}`

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search_query: s as string }))
    if (te) {
      setTo(te as string)
    } else {
      setTo('')
    }
    if (ts) {
      setFrom(ts as string)
    } else {
      setFrom('')
    }
  }, [s, te, ts])

  useEffect(() => {
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        q: undefined,
        s: filters.search_query || '',
        ts: params.timestamp_start,
        te: params.timestamp_end,
      },
    })
  }, [params.timestamp_end, params.timestamp_start, filters.search_query])
  const onSelectTemplate = (template: LogTemplate) => {
    setFilters((prev) => ({ ...prev, search_query: template.searchString }))
  }

  const handleRefresh = () => {
    refresh()
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        te: undefined,
        ts: undefined,
      },
    })
  }

  const handleSearch: LogSearchCallback = ({ query, to, from, fromMicro, toMicro }) => {
    let toValue, fromValue
    if (to || toMicro) {
      toValue = toMicro ? toMicro : dayjs(to).valueOf() * 1000

      setTo(String(toValue))
    }
    if (from || fromMicro) {
      const fromValue = fromMicro ? fromMicro : dayjs(from).valueOf() * 1000
      setFrom(String(fromValue))
    }
    setFilters((prev) => ({ ...prev, search_query: query || '' }))
  }

  return (
    <SettingsLayout title={title}>
      <div className="h-full flex flex-col flex-grow">
        <LogPanel
          isShowingEventChart={showChart}
          onToggleEventChart={() => setShowChart(!showChart)}
          isCustomQuery={false}
          isLoading={isLoading}
          newCount={newCount}
          templates={TEMPLATES.filter(
            (template) => template.for?.includes(type as string) && template.mode === 'simple'
          )}
          onRefresh={handleRefresh}
          onSearch={handleSearch}
          defaultSearchValue={filters.search_query}
          defaultToValue={
            params.timestamp_end ? dayjs(Number(params.timestamp_end) / 1000).toISOString() : ''
          }
          defaultFromValue={
            params.timestamp_start
              ? dayjs(Number(params.timestamp_start) / 1000).toISOString()
              : oldestTimestamp
              ? dayjs(Number(oldestTimestamp) / 1000).toISOString()
              : ''
          }
          onCustomClick={() => {
            router.push(`/project/${ref}/settings/logs/explorer?q=${params.rawSql}`)
          }}
          onSelectTemplate={onSelectTemplate}
        />
        {showChart && (
          <div>
            <LogEventChart
              data={!isLoading ? logData : undefined}
              onBarClick={(timestampMicro) => {
                handleSearch({ query: filters.search_query, toMicro: timestampMicro })
              }}
            />
          </div>
        )}
        <div className="flex flex-col flex-grow relative">
          {isLoading && (
            <div
              className={[
                'absolute top-0 w-full h-full flex items-center justify-center',
                'bg-gray-100 opacity-75 z-50',
              ].join(' ')}
            >
              <IconLoader className="animate-spin" />
            </div>
          )}

          <LogTable data={logData} isCustomQuery={false} />
          <div className="p-2">
            <Button onClick={() => loadOlder()} icon={<IconRewind />} type="default">
              Load older
            </Button>
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
