import { useEffect, useState } from 'react'
import { Button, IconExternalLink, IconEye, IconEyeOff, IconRefreshCw, IconSearch, Input } from 'ui'

import CSVButton from 'components/ui/CSVButton'
import { Filters, LogSearchCallback, LogTemplate, PREVIEWER_DATEPICKER_HELPERS } from '.'
import { FILTER_OPTIONS, LogsTableName } from './Logs.constants'
import DatePickers from './Logs.DatePickers'
import LogsFilterPopover from './LogsFilterPopover'

interface PreviewFilterPanelProps {
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

/**
 * Logs control panel header + wrapper
 */
const PreviewFilterPanel = ({
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
}: PreviewFilterPanelProps) => {
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
                'absolute -top-3 right-3 flex items-center justify-center',
                'z-50 h-4 w-4',
              ].join(' ')}
            >
              <div className="absolute z-20">
                <p style={{ fontSize: '0.6rem' }} className="text-white">
                  {newCount > 1000 ? `${Math.floor(newCount / 100) / 10}K` : newCount}
                </p>
              </div>
              <div className="h-full w-full animate-ping rounded-full bg-green-800 opacity-60"></div>
              <div className="z-60 absolute top-0 right-0 h-full w-full rounded-full bg-green-900 opacity-80"></div>
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
  const handleDatepickerChange = ({ to, from }: Partial<Parameters<LogSearchCallback>[1]>) => {
    onSearch('datepicker-change', { to, from })
  }
  const handleInputSearch = (query: string) => onSearch('search-input-change', { query })

  return (
    <div
      className={'flex w-full items-center justify-between' + (condensedLayout ? ' px-5 pt-4' : '')}
    >
      <div className="flex flex-row items-center gap-4">
        <form
          id="log-panel-search"
          onSubmit={(e) => {
            // prevent redirection
            e.preventDefault()
            handleInputSearch(search)
          }}
        >
          <Input
            className="w-60"
            size="tiny"
            placeholder="Search events"
            onChange={(e) => setSearch(e.target.value)}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              setSearch(e.target.value)
              handleInputSearch(e.target.value)
            }}
            icon={
              <div className="text-foreground-lighter">
                <IconSearch size={14} />
              </div>
            }
            value={search}
            actions={
              hasEdits && (
                <button
                  onClick={() => handleInputSearch(search)}
                  className="mx-2 text-foreground-light hover:text-foreground"
                >
                  {'↲'}
                </button>
              )
            }
          />
        </form>

        <DatePickers
          onChange={handleDatepickerChange}
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

      <Button type="default" onClick={onExploreClick} iconRight={<IconExternalLink size={10} />}>
        Explore via query
      </Button>
    </div>
  )
}

export default PreviewFilterPanel
