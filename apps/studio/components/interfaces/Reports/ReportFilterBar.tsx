import { ChevronDown, Database, Plus, RefreshCw, X } from 'lucide-react'
import { ComponentProps, useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { Auth, Realtime, Storage } from 'icons'
import { BASE_PATH } from 'lib/constants'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Select,
  cn,
} from 'ui'
import { DatePickerValue, LogsDatePicker } from '../Settings/Logs/Logs.DatePickers'
import { REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import type { ReportFilterItem } from './Reports.types'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/shadcn/ui/popover'

interface ReportFilterBarProps {
  filters: ReportFilterItem[]
  isLoading: boolean
  onAddFilter: (filter: ReportFilterItem) => void
  onRemoveFilters: (filters: ReportFilterItem[]) => void
  onRefresh?: () => void
  onDatepickerChange?: ComponentProps<typeof LogsDatePicker>['onSubmit']
  datepickerTo?: string
  datepickerFrom?: string
  datepickerHelpers: typeof REPORTS_DATEPICKER_HELPERS
  initialDatePickerValue?: DatePickerValue
  className?: string
  selectedProduct?: string
  showDatabaseSelector?: boolean
  hideDatepicker?: boolean
}

const PRODUCT_FILTERS = [
  {
    key: 'rest',
    filterKey: 'request.path',
    filterValue: '/rest',
    label: 'REST',
    description: 'Requests made to PostgREST',
    icon: Database,
  },
  {
    key: 'auth',
    filterKey: 'request.path',
    filterValue: '/auth',
    label: 'Auth',
    description: 'Auth and authorization requests',
    icon: Auth,
  },
  {
    key: 'storage',
    filterKey: 'request.path',
    filterValue: '/storage',
    label: 'Storage',
    description: 'Storage asset requests',
    icon: Storage,
  },
  {
    key: 'realtime',
    filterKey: 'request.path',
    filterValue: '/realtime',
    label: 'Realtime',
    description: 'Realtime connection requests',
    icon: Realtime,
  },
  {
    key: 'graphql',
    filterKey: 'request.path',
    filterValue: '/graphql',
    label: 'GraphQL',
    description: 'Requests made to pg_graphql',
    icon: null,
  },
]

const ReportFilterBar = ({
  filters,
  isLoading = false,
  onAddFilter,
  onDatepickerChange,
  hideDatepicker = false,
  onRemoveFilters,
  onRefresh,
  datepickerHelpers,
  initialDatePickerValue,
  className,
  selectedProduct,
  showDatabaseSelector = true,
}: ReportFilterBarProps) => {
  const { ref } = useParams()
  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef: ref })

  const filterKeys = [
    'request.path',
    'request.method',
    'request.search',
    'request.headers.x_client_info',
    'request.headers.user_agent',
    'response.status_code',
  ]
  const [showAdder, setShowAdder] = useState(false)
  const [currentProductFilter, setCurrentProductFilter] = useState<
    null | (typeof PRODUCT_FILTERS)[number]
  >(null)
  const [addFilterValues, setAddFilterValues] = useState<ReportFilterItem>({
    key: filterKeys[0],
    compare: 'matches',
    value: '',
  })

  const resetFilterValues = () => {
    setAddFilterValues({
      key: filterKeys[0],
      compare: 'matches',
      value: '',
    })
  }

  const handleDatepickerChange = (vals: DatePickerValue) => {
    onDatepickerChange && onDatepickerChange(vals)
    setSelectedRange(vals)
  }

  const handleProductFilterChange = async (
    nextProductFilter: null | (typeof PRODUCT_FILTERS)[number]
  ) => {
    const toRemove = PRODUCT_FILTERS.map(
      (productFilter) =>
        ({
          key: productFilter.filterKey,
          compare: 'matches',
          value: productFilter.filterValue,
        }) as ReportFilterItem
    )
    onRemoveFilters(toRemove)
    if (nextProductFilter) {
      onAddFilter({
        key: nextProductFilter.filterKey,
        compare: 'matches',
        value: nextProductFilter.filterValue,
      })
    }
    setCurrentProductFilter(nextProductFilter)
  }

  useEffect(() => {
    if (selectedProduct) {
      handleProductFilterChange(PRODUCT_FILTERS.find((p) => p.key === selectedProduct) ?? null)
    }
  }, [])

  const getInitialDatePickerValue = () => {
    if (initialDatePickerValue) {
      return initialDatePickerValue
    }
    const defaultHelper = datepickerHelpers.find((h) => h.default) || datepickerHelpers[0]
    return {
      to: defaultHelper.calcTo(),
      from: defaultHelper.calcFrom(),
      isHelper: true,
      text: defaultHelper.text,
    }
  }

  const [selectedRange, setSelectedRange] = useState<DatePickerValue>(getInitialDatePickerValue())

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex flex-row justify-start items-center flex-wrap gap-2">
        {onRefresh && (
          <ButtonTooltip
            type="default"
            disabled={isLoading}
            icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
            className="w-7"
            tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
            onClick={() => onRefresh()}
          />
        )}
        {!hideDatepicker && (
          <LogsDatePicker
            onSubmit={handleDatepickerChange}
            value={selectedRange}
            helpers={datepickerHelpers}
          />
        )}
        {!selectedProduct && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                className="inline-flex flex-row gap-2"
                iconRight={<ChevronDown size={14} />}
              >
                <span>
                  {currentProductFilter === null ? 'All Requests' : currentProductFilter.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem onClick={() => handleProductFilterChange(null)}>
                <p>All Requests</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {PRODUCT_FILTERS.map((productFilter) => {
                const Icon = productFilter.icon

                return (
                  <DropdownMenuItem
                    key={productFilter.key}
                    className="space-x-2"
                    disabled={productFilter.key === currentProductFilter?.key}
                    onClick={() => handleProductFilterChange(productFilter)}
                  >
                    {productFilter.key === 'graphql' ? (
                      <SVG
                        src={`${BASE_PATH}/img/graphql.svg`}
                        className="w-[20px] h-[20px] mr-2"
                        preProcessor={(code) =>
                          code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                        }
                      />
                    ) : Icon !== null ? (
                      <Icon size={20} strokeWidth={1.5} className="mr-2" />
                    ) : null}
                    <div className="flex flex-col">
                      <p
                        className={cn(
                          productFilter.key === currentProductFilter?.key ? 'font-bold' : '',
                          'inline-block'
                        )}
                      >
                        {productFilter.label}
                      </p>
                      <p className=" text-left text-foreground-light inline-block w-[180px]">
                        {productFilter.description}
                      </p>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {filters
          .filter(
            (filter) =>
              filter.value !== currentProductFilter?.filterValue ||
              filter.key !== currentProductFilter?.filterKey
          )
          .map((filter) => (
            <div
              key={`${filter.key}-${filter.compare}-${filter.value}`}
              className="text-xs rounded-md font-mono bg-surface-300 px-2 h-[26px] flex flex-row justify-center gap-1 items-center"
            >
              <span className="">{filter.key}</span>
              <span className="text-foreground-lighter">{filter.compare}</span>
              <span className="">{filter.value}</span>
              <Button
                type="text"
                size="tiny"
                className="!p-0 !space-x-0"
                onClick={() => onRemoveFilters([filter])}
                icon={<X className="text-foreground-light" />}
              >
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        <Popover open={showAdder} onOpenChange={(openValue) => setShowAdder(openValue)}>
          <PopoverTrigger>
            <Button
              asChild
              type="default"
              size="tiny"
              icon={<Plus className={`text-foreground-light `} />}
            >
              <span>Add filter</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align={filters.length > 0 ? 'end' : 'start'}
            portal={true}
            className="p-0 w-60"
          >
            <div className="flex flex-col gap-3 p-3">
              <Select
                size="tiny"
                value={addFilterValues.key}
                onChange={(e) => {
                  setAddFilterValues((prev) => ({ ...prev, key: e.target.value }))
                }}
                label="Attribute Filter"
                className="gap-[2px]"
              >
                {filterKeys.map((key) => (
                  <Select.Option key={key} value={key}>
                    {key}
                  </Select.Option>
                ))}
              </Select>
              <Select
                size="tiny"
                value={addFilterValues.compare}
                onChange={(e) => {
                  setAddFilterValues((prev) => ({
                    ...prev,
                    compare: e.target.value as ReportFilterItem['compare'],
                  }))
                }}
                label="Comparison"
                className="gap-[2px]"
              >
                {['matches', 'is'].map((value) => (
                  <Select.Option key={value} value={value}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
              <Input
                size="tiny"
                label="Value"
                className="gap-[2px]"
                placeholder={
                  addFilterValues.compare === 'matches'
                    ? 'Provide a regex expression'
                    : 'Provide a string'
                }
                onChange={(e) => {
                  setAddFilterValues((prev) => ({ ...prev, value: e.target.value }))
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-default p-2">
              <Button
                type="primary"
                size="tiny"
                onClick={() => {
                  onAddFilter(addFilterValues)
                  setShowAdder(false)
                  resetFilterValues()
                }}
              >
                Add filter
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {showDatabaseSelector && (
        <DatabaseSelector
          additionalOptions={
            (loadBalancers ?? []).length > 0
              ? [{ id: `${ref}-all`, name: 'API Load Balancer' }]
              : []
          }
        />
      )}
    </div>
  )
}

export default ReportFilterBar
