import React, { FC, useEffect, useState } from 'react'
import {
  Button,
  Input,
  Typography,
  IconRefreshCw,
  IconX,
  IconSearch,
  IconClock,
  Popover,
  IconExternalLink,
  Toggle,
  IconEye,
  IconEyeOff,
} from '@supabase/ui'
import { LogSearchCallback, LogTemplate } from '.'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FILTER_OPTIONS, LogsTableName } from './Logs.constants'
import { LogsFilter } from './Logs.filter'
import DatePickers from './Logs.DatePickers'

interface Props {
  defaultSearchValue?: string
  defaultToValue?: string
  defaultFromValue?: string
  templates?: any
  isLoading: boolean
  isCustomQuery: boolean
  newCount: number
  onRefresh?: () => void
  onSearch?: LogSearchCallback
  onCustomClick?: () => void
  onSelectTemplate: (template: LogTemplate) => void
  isShowingEventChart: boolean
  onToggleEventChart: () => void
  dispatchWhereFilters: (x: any) => void
  whereFilters: any
  table: LogsTableName
  condensedLayout: Boolean
}

dayjs.extend(utc)

/**
 * Logs control panel header + wrapper
 */
const PreviewFilterPanel: FC<Props> = ({
  isLoading,
  isCustomQuery,
  newCount,
  onRefresh,
  onSearch = () => {},
  defaultSearchValue = '',
  defaultToValue = '',
  defaultFromValue = '',
  onCustomClick,
  dispatchWhereFilters,
  whereFilters: filters,
  table,
  isShowingEventChart,
  onToggleEventChart,
  condensedLayout,
}) => {
  const [search, setSearch] = useState('')

  const [to, setTo] = useState({ value: '', error: '' })
  const [from, setFrom] = useState({ value: '', error: '' })
  const [defaultTimestamp, setDefaultTimestamp] = useState(dayjs().utc().toISOString())

  const hasEdits = search !== defaultSearchValue

  // Sync local state with provided default value
  useEffect(() => {
    if (search !== defaultSearchValue) {
      setSearch(defaultSearchValue)
    }
  }, [defaultSearchValue])

  useEffect(() => {
    if (to.value !== defaultToValue) {
      setTo({ value: defaultToValue, error: '' })
    }
  }, [defaultToValue])

  const RefreshButton = () => {
    return !isCustomQuery ? (
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
                    {newCount}
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
        onClick={onRefresh}
      >
        Refresh
      </Button>
    ) : null
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log('value', value)
    if (value !== '' && isNaN(Date.parse(value))) {
      setTo({ value, error: 'Invalid ISO 8601 timestamp' })
    } else {
      setTo({ value, error: '' })
    }
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value !== '' && isNaN(Date.parse(value))) {
      setFrom({ value, error: 'Invalid ISO 8601 timestamp' })
    } else {
      setFrom({ value, error: '' })
    }
  }

  const handleReset = async () => {
    setTo({ value: '', error: '' })
    setFrom({ value: '', error: '' })
    const value = dayjs().utc().toISOString()
    setDefaultTimestamp(value)
    onSearch({ query: search, to: '', from: '' })
  }

  const handleSearch = () => onSearch({ query: search, to: to.value, from: from.value })

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
            handleSearch()
          }}
        >
          <Input
            className="w-60"
            size="tiny"
            placeholder="Search events"
            onChange={(e) => setSearch(e.target.value)}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              setSearch(e.target.value)
              handleSearch()
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
                  onClick={() => handleSearch()}
                  className="text-scale-1100 hover:text-scale-1200 mx-2"
                >
                  {'↲'}
                </button>
              )
            }
          />
        </form>

        <DatePickers
          onChange={(e: any) => {
            setFrom({ value: e.from, error: '' })
            setTo({ value: e.to, error: '' })
            handleSearch()
          }}
          to={defaultToValue}
          from={defaultFromValue}
        />

        <div>
          <RefreshButton />
        </div>

        <div className="flex items-center gap-2">
          {FILTER_OPTIONS[table] &&
            Object.values(FILTER_OPTIONS[table]).map((x) => (
              <LogsFilter
                key={`${x.key}-filter`}
                options={x}
                dispatchFilters={dispatchWhereFilters}
                filtersState={filters}
              />
            ))}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="default"
            onClick={() => onToggleEventChart()}
            icon={isShowingEventChart ? <IconEye /> : <IconEyeOff />}
          >
            Event chart
          </Button>
        </div>
      </div>
      <Button type="secondary" onClick={onCustomClick} iconRight={<IconExternalLink size={10} />}>
        Explore via query
      </Button>
    </div>
  )
}

export default PreviewFilterPanel
