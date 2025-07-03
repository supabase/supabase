import { ChevronDown, Database, RefreshCw } from 'lucide-react'
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
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { DatePickerValue, LogsDatePicker } from '../Settings/Logs/Logs.DatePickers'
import { REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import { ReportFilterPopover } from './ReportFilterPopover'
import { useReportFilters } from './useReportFilters'

import type { ReportFilterItem } from './Reports.types'

interface ReportFilterBarProps {
  filters: ReportFilterItem[]
  isLoading: boolean
  onAddFilter: (filter: ReportFilterItem) => void
  onRemoveFilters: (filters: ReportFilterItem[]) => void
  onRefresh: () => void
  onDatepickerChange: ComponentProps<typeof LogsDatePicker>['onSubmit']
  datepickerTo?: string
  datepickerFrom?: string
  datepickerHelpers: typeof REPORTS_DATEPICKER_HELPERS
  selectedProduct?: string
  className?: string
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
  onRemoveFilters,
  onRefresh,
  datepickerHelpers,
  selectedProduct,
  className,
}: ReportFilterBarProps) => {
  //const { ref } = useParams()
  //const { data: loadBalancers } = useLoadBalancersQuery({ projectRef: ref })
  const [currentProductFilter, setCurrentProductFilter] = useState<
    null | (typeof PRODUCT_FILTERS)[number]
  >(null)

  // Use the custom hook for filter management
  // const { localFilters, filterProperties, handleFilterChange } = useReportFilters({
  //   onAddFilter,
  //   onRemoveFilters,
  //   filters,
  // })

  const handleDatepickerChange = (vals: DatePickerValue) => {
    onDatepickerChange(vals)
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

  const defaultHelper = datepickerHelpers[0]
  const [selectedRange, setSelectedRange] = useState<DatePickerValue>({
    to: defaultHelper.calcTo(),
    from: defaultHelper.calcFrom(),
    isHelper: true,
    text: defaultHelper.text,
  })

  useEffect(() => {
    if (selectedProduct) {
      handleProductFilterChange(PRODUCT_FILTERS.find((p) => p.key === selectedProduct) ?? null)
    }
  }, [])

  return (
    <div className={cn('flex flex-wrap md:items-center justify-between gap-2', className)}>
      <div className="flex gap-2">
        <ButtonTooltip
          type="default"
          disabled={isLoading}
          icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
          className="w-7"
          tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
          onClick={() => onRefresh()}
        />
        <LogsDatePicker
          onSubmit={handleDatepickerChange}
          value={selectedRange}
          helpers={datepickerHelpers}
        />
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
              {PRODUCT_FILTERS.map((productFilterItem) => {
                const Icon = productFilterItem.icon

                return (
                  <DropdownMenuItem
                    key={productFilterItem.key}
                    className="space-x-2"
                    disabled={productFilterItem.key === currentProductFilter?.key}
                    onClick={() => handleProductFilterChange(productFilterItem)}
                  >
                    {productFilterItem.key === 'graphql' ? (
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
                          productFilterItem.key === currentProductFilter?.key ? 'font-bold' : '',
                          'inline-block'
                        )}
                      >
                        {productFilterItem.label}
                      </p>
                      <p className=" text-left text-foreground-light inline-block w-[180px]">
                        {productFilterItem.description}
                      </p>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {/* <div className="order-last md:order-none flex-1">
        <ReportFilterPopover
          filterProperties={filterProperties}
          filters={localFilters}
          onFiltersChange={handleFilterChange}
        />
      </div> */}

      {/* <DatabaseSelector
        additionalOptions={
          (loadBalancers ?? []).length > 0 ? [{ id: `${ref}-all`, name: 'API Load Balancer' }] : []
        }
      /> */}
    </div>
  )
}
export default ReportFilterBar
