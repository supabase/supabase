import { IconRefreshCw } from '@supabase/ui'
import useDbQuery from 'hooks/analytics/useDbQuery'
import useLogsQuery, { LogsQueryData, LogsQueryHandlers } from 'hooks/analytics/useLogsQuery'
import React from 'react'
import { Button } from 'ui'
import { DatePickerToFrom } from '../Settings/Logs'
import DatePickers from '../Settings/Logs/Logs.DatePickers'
import { DEFAULT_QUERY_PARAMS, REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import { DbQueryData, DbQueryHandler, PresetConfig } from './Reports.types'

/**
 * Converts a query params string to an object
 */
export const queryParamsToObject = (params: string) => {
  return Object.fromEntries(new URLSearchParams(params))
}

// generate hooks based on preset config
type PresetHookResult = [LogsQueryData | DbQueryData, LogsQueryHandlers | DbQueryHandler]
type PresetHooks = Record<keyof PresetConfig['queries'], () => PresetHookResult>
export const hooksFactory = (projectRef: string, config: PresetConfig) => {
  const hooks: PresetHooks = Object.entries(config.queries).reduce(
    (acc, [k, { sql, queryType }]) => {
      if (queryType === 'db') {
        return {
          ...acc,
          [k]: () => useDbQuery(sql),
        }
      } else {
        return {
          ...acc,
          [k]: () =>
            useLogsQuery(projectRef, {
              sql: sql as string,
              ...DEFAULT_QUERY_PARAMS,
            }),
        }
      }
    },
    {}
  )
  return hooks
}

export const usePresetReport = (hooks: PresetHookResult[]) => {
  const data = hooks.map((h) => h[0])
  const handlers = hooks.map((h) => h[1])
  const handleRefresh = () => {
    handlers.forEach((handler) => {
      handler.runQuery()
    })
  }
  const handleDatepickerChange = ({ to, from }: DatePickerToFrom) => {
    const newParams = { iso_timestamp_start: from || '', iso_timestamp_end: to || '' }

    handlers.forEach((handler) => {
      if (handler.setParams) {
        handler.setParams((prev) => ({
          ...prev,
          ...newParams,
        }))
      }
    })
  }
  const isLoading = data.map((datum) => datum.isLoading).some((v) => v)

  const Layout: React.FC<{ title: string }> = ({ title, children }) => (
    <div className="1xl:px-28 mx-auto flex flex-col gap-4 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
      <h1 className="text-2xl text-scale-1200">{title}</h1>
      <div className="flex flex-row justify-between">
        <DatePickers
          onChange={handleDatepickerChange}
          to={data[0]?.params?.iso_timestamp_end || ''}
          from={data[0]?.params?.iso_timestamp_start || ''}
          helpers={REPORTS_DATEPICKER_HELPERS}
        />
        <Button
          type="default"
          size="tiny"
          onClick={handleRefresh}
          disabled={isLoading ? true : false}
          icon={
            <IconRefreshCw
              size="tiny"
              className={`text-scale-1100 ${isLoading ? 'animate-spin' : ''}`}
            />
          }
        >
          Refresh
        </Button>
      </div>

      {children}
    </div>
  )
  return {
    isLoading,
    Layout,
    handleRefresh,
    handleDatepickerChange,
  }
}
