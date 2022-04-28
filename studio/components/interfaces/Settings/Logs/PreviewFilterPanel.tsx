import React, { FC, useEffect, useState } from 'react'
import {
  Button,
  Input,
  Typography,
  IconRefreshCw,
  IconSearch,
  IconExternalLink,
  IconEye,
  IconEyeOff,
} from '@supabase/ui'
import { Filters, LogSearchCallback, LogTemplate, PREVIEWER_DATEPICKER_HELPERS } from '.'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FILTER_OPTIONS, LogsTableName } from './Logs.constants'
import LogsFilterPopover from './LogsFilterPopover'
import DatePickers from './Logs.DatePickers'
import CSVButton from 'components/ui/CSVButton'

interface Props {
  defaultSearchValue?: string
  defaultToValue?: string
  defaultFromValue?: string
  templates?: any
  isLoading: boolean
  newCount: number
  onRefresh?: () => void
  onSearch?: LogSearchCallback
  onExploreClick?: () => void
  onSelectTemplate: (template: LogTemplate) => void
  table: LogsTableName
  condensedLayout: Boolean
  isShowingEventChart: boolean
  onToggleEventChart: () => void
  csvData?: unknown[]
  onFiltersChange: (filters: Filters) => void
  filters: Filters
}

dayjs.extend(utc)

/**
 * Logs control panel header + wrapper
 */
const PreviewFilterPanel: FC<Props> = ({
  isLoading,
  newCount,
  onRefresh,
  onSearch = () => {},
  defaultSearchValue = '',
  defaultToValue = '',
  defaultFromValue = '',
  onExploreClick,
  condensedLayout,
  isShowingEventChart,
  onToggleEventChart,
  csvData,
  onFiltersChange,
  filters,
  table,
}) => {
  const [search, setSearch] = useState('')

  const hasEdits = search !== defaultSearchValue

  // Sync local state with provided default value
  useEffect(() => {
    if (search !== defaultSearchValue) {
      setSearch(defaultSearchValue)
    }
  }, [defaultSearchValue])

  const RefreshButton = () => (
    <Button
      type="default"
      icon={
        <div className="relative">
          {newCount > 0 && (
            <div
              className={[
                'absolute flex items-center justify-center -top-3 right-3',
                'h-4 w-4 z-50',
              ].join(' ')}
            >
              <div className="absolute z-20">
                <Typography.Text style={{ fontSize: '0.6rem' }} className="opacity-80">
                  {newCount > 1000 ? `${Math.floor(newCount / 100) / 10}K` : newCount}
                </Typography.Text>
              </div>
              <div className="bg-green-800 rounded-full w-full h-full animate-ping opacity-60"></div>
              <div className="absolute z-60 top-0 right-0 bg-green-900 opacity-80 rounded-full w-full h-full"></div>
            </div>
          )}
          <IconRefreshCw size={10} />
        </div>
      }
      loading={isLoading}
      disabled={isLoading}
      onClick={onRefresh}
    >
      Refresh
    </Button>
  )
  const handleSearch = (partial: Partial<Parameters<LogSearchCallback>[0]>) =>
    onSearch({ query: search, to: partial?.to || null, from: partial?.from || null })

  return (
    <div
      className={'flex items-center justify-between w-full' + (condensedLayout ? ' px-5 pt-4' : '')}
    >
      <div className="flex flex-row gap-4 items-center">
        <form
          id="log-panel-search"
          onSubmit={(e) => {
            // prevent redirection
            e.preventDefault()
            handleSearch({})
          }}
        >
          <Input
            className="w-60"
            size="tiny"
            placeholder="Search events"
            onChange={(e) => setSearch(e.target.value)}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              setSearch(e.target.value)
              handleSearch({ query: e.target.value })
            }}
            icon={
              <div className="text-scale-900">
                <IconSearch size={14} />
              </div>
            }
            value={search}
            actions={
              hasEdits && (
                <button
                  onClick={() => handleSearch({})}
                  className="text-scale-1100 hover:text-scale-1200 mx-2"
                >
                  {'↲'}
                </button>
              )
            }
          />
        </form>

        <DatePickers
          onChange={handleSearch}
          to={defaultToValue}
          from={defaultFromValue}
          helpers={PREVIEWER_DATEPICKER_HELPERS}
        />

        <div>
          <RefreshButton />
        </div>

        <div className="flex items-center">
          {FILTER_OPTIONS[table] &&
            Object.values(FILTER_OPTIONS[table]).map((x, i: number) => {
              const classes = []

              if (Object.values(FILTER_OPTIONS[table]).length >= 2) {
                if (i === 0) {
                  classes.push('rounded-tr-none rounded-br-none')
                } else if (i === Object.values(FILTER_OPTIONS[table]).length - 1) {
                  classes.push('rounded-tl-none rounded-bl-none')
                } else {
                  classes.push('rounded-none')
                }
              }

              return (
                <LogsFilterPopover
                  buttonClassName={classes.join(' ')}
                  key={`${x.key}-filter`}
                  options={x}
                  onFiltersChange={onFiltersChange}
                  filters={filters}
                />
              )
            })}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="default"
            onClick={() => onToggleEventChart()}
            icon={isShowingEventChart ? <IconEye /> : <IconEyeOff />}
          >
            Chart
          </Button>
        </div>
        <CSVButton data={csvData} disabled={!Boolean(csvData)} title="Download data" />
      </div>

      <Button type="secondary" onClick={onExploreClick} iconRight={<IconExternalLink size={10} />}>
        Explore via query
      </Button>
    </div>
  )
}

export default PreviewFilterPanel
