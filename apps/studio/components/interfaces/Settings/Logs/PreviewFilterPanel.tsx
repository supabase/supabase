import { useParams } from 'common'
import { Eye, EyeOff, RefreshCw, Search, Terminal, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  Button,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import {
  FILTER_OPTIONS,
  LOG_ROUTES_WITH_REPLICA_SUPPORT,
  LogsTableName,
  PREVIEWER_DATEPICKER_HELPERS,
} from './Logs.constants'
import { DatePickerValue, LogsDatePicker } from './Logs.DatePickers'
import type { Filters, LogSearchCallback, LogTemplate } from './Logs.types'
import LogsFilterPopover from './LogsFilterPopover'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { useLoadBalancersQuery } from '@/data/read-replicas/load-balancers-query'
import { IS_PLATFORM } from '@/lib/constants'

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
  queryUrl: string
  onSelectTemplate: (template: LogTemplate) => void
  table: LogsTableName
  condensedLayout: Boolean
  isShowingEventChart: boolean
  onToggleEventChart: () => void
  csvData?: unknown[]
  onFiltersChange: (filters: Filters) => void
  filters: Filters
  onSelectedDatabaseChange: (id: string) => void
  className?: string
  selectedDatePickerValue: DatePickerValue
  setSelectedDatePickerValue: (value: DatePickerValue) => void
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
  onExploreClick,
  queryUrl,
  condensedLayout,
  isShowingEventChart,
  onToggleEventChart,
  csvData,
  onFiltersChange,
  filters,
  table,
  onSelectedDatabaseChange,
  className,
  selectedDatePickerValue,
  setSelectedDatePickerValue,
}: PreviewFilterPanelProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const [search, setSearch] = useState('')

  const logName = router.pathname.split('/').pop()

  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef: ref })

  // [Joshen] These are the routes tested that can show replica logs
  const showDatabaseSelector =
    IS_PLATFORM && LOG_ROUTES_WITH_REPLICA_SUPPORT.includes(router.pathname)

  const hasEdits = search !== defaultSearchValue

  const handleInputSearch = (query: string) => onSearch('search-input-change', { query })

  // Sync local state with provided default value
  useEffect(() => {
    if (search !== defaultSearchValue) {
      setSearch(defaultSearchValue)
    }
  }, [defaultSearchValue])

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between overflow-x-scroll no-scrollbar h-[calc(var(--header-height)-1px)]',
        condensedLayout ? ' p-3' : '',
        className
      )}
    >
      <div className="flex flex-row items-center gap-x-2 mr-2">
        <form
          id="log-panel-search"
          onSubmit={(e) => {
            // prevent redirection
            e.preventDefault()
            handleInputSearch(search)
          }}
        >
          <InputGroup className="w-60">
            <InputGroupInput
              size="tiny"
              placeholder="Search events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                setSearch(e.target.value)
                handleInputSearch(e.target.value)
              }}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <div className="flex items-center gap-x-1">
                {hasEdits && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InputGroupButton type="text" onClick={() => handleInputSearch(search)}>
                        <span>↲</span>
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Search for events</TooltipContent>
                  </Tooltip>
                )}

                {search.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InputGroupButton
                        type="text"
                        onClick={() => {
                          setSearch('')
                          handleInputSearch('')
                        }}
                      >
                        <X />
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Clear search</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              title="refresh"
              type="default"
              className="px-1.5"
              icon={
                <div className="relative">
                  {newCount > 0 && (
                    <div className="absolute -top-3 -right-3 flex items-center justify-center">
                      <div className="absolute h-4 w-4 animate-ping rounded-full bg-brand opacity-60"></div>
                      <div className="relative z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-medium leading-none text-white">
                        {newCount > 1000 ? `${Math.floor(newCount / 100) / 10}K` : newCount}
                      </div>
                    </div>
                  )}
                  <RefreshCw />
                </div>
              }
              loading={isLoading}
              disabled={isLoading}
              onClick={onRefresh}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Refresh logs
          </TooltipContent>
        </Tooltip>

        <LogsDatePicker
          helpers={PREVIEWER_DATEPICKER_HELPERS}
          onSubmit={(vals) => {
            onSearch('datepicker-change', { to: vals.to, from: vals.from })
            setSelectedDatePickerValue(vals)
          }}
          value={selectedDatePickerValue}
        />

        {FILTER_OPTIONS[table] !== undefined && (
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

                const lastItemIndex = Object.values(FILTER_OPTIONS[table]).length - 1
                const align = i === 0 ? 'start' : i === lastItemIndex ? 'end' : 'center'

                return (
                  <LogsFilterPopover
                    buttonClassName={classes.join(' ')}
                    key={`${x.key}-filter`}
                    options={x}
                    onFiltersChange={onFiltersChange}
                    filters={filters}
                    align={align}
                  />
                )
              })}
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Button
            type="default"
            onClick={() => onToggleEventChart()}
            icon={isShowingEventChart ? <Eye /> : <EyeOff />}
          >
            Chart
          </Button>
        </div>
        {Boolean(csvData) && (
          <DownloadResultsButton
            iconOnly
            type="default"
            align="center"
            results={csvData ?? []}
            fileName={`supabase-${logName}-${ref}.csv`}
          />
        )}
      </div>

      {showDatabaseSelector ? (
        <div className="flex items-center justify-center gap-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild className="px-1.5" type="default" icon={<Terminal />}>
                <Link href={queryUrl} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Open query in Logs Explorer
            </TooltipContent>
          </Tooltip>
          <DatabaseSelector
            onSelectId={onSelectedDatabaseChange}
            additionalOptions={
              table === LogsTableName.EDGE
                ? (loadBalancers ?? []).length > 0
                  ? [{ id: `${ref}-all`, name: 'API Load Balancer' }]
                  : []
                : []
            }
          />
        </div>
      ) : (
        <Button asChild type="default" onClick={onExploreClick}>
          <Link href={queryUrl}>Explore via query</Link>
        </Button>
      )}
    </div>
  )
}

export default PreviewFilterPanel
