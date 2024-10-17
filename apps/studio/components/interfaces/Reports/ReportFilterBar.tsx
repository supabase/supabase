import { ChevronDown, Database, Plus, X } from 'lucide-react'
import { ComponentProps, useState } from 'react'
import SVG from 'react-inlinesvg'

import { useParams } from 'common'
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
  Popover,
  Select,
  cn,
} from 'ui'
import DatePickers from '../Settings/Logs/Logs.DatePickers'
import { REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import type { ReportFilterItem } from './Reports.types'

interface ReportFilterBarProps {
  filters: ReportFilterItem[]
  onAddFilter: (filter: ReportFilterItem) => void
  onRemoveFilters: (filters: ReportFilterItem[]) => void
  onDatepickerChange: ComponentProps<typeof DatePickers>['onChange']
  datepickerTo?: string
  datepickerFrom?: string
  datepickerHelpers: typeof REPORTS_DATEPICKER_HELPERS
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
  onAddFilter,
  onDatepickerChange,
  datepickerTo = '',
  datepickerFrom = '',
  onRemoveFilters,
  datepickerHelpers,
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

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-row justify-start items-center flex-wrap gap-2">
        <DatePickers
          onChange={onDatepickerChange}
          to={datepickerTo}
          from={datepickerFrom}
          helpers={datepickerHelpers}
        />
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
        {filters
          .filter(
            (filter) =>
              filter.value !== currentProductFilter?.filterValue ||
              filter.key !== currentProductFilter?.filterKey
          )
          .map((filter) => (
            <div
              key={`${filter.key}-${filter.compare}-${filter.value}`}
              className="text-xs rounded border border-foreground-lighter bg-surface-300 px-2 h-7 flex flex-row justify-center gap-1 items-center"
            >
              {filter.key} {filter.compare} {filter.value}
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
        <Popover
          align="end"
          header={
            <div className="flex justify-between items-center py-1">
              <h5 className="text-sm text-foreground">Add Filter</h5>

              <Button
                type="primary"
                size="tiny"
                onClick={() => {
                  onAddFilter(addFilterValues)
                  setShowAdder(false)
                  resetFilterValues()
                }}
              >
                Save
              </Button>
            </div>
          }
          open={showAdder}
          onOpenChange={(openValue) => setShowAdder(openValue)}
          overlay={
            <div className="px-3 py-3 flex flex-col gap-2">
              <Select
                size="tiny"
                value={addFilterValues.key}
                onChange={(e) => {
                  setAddFilterValues((prev) => ({ ...prev, key: e.target.value }))
                }}
                label="Attribute Filter"
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
          }
          showClose
        >
          <Button
            asChild
            type="default"
            size="tiny"
            icon={<Plus className={`text-foreground-light `} />}
          >
            <span>Add filter</span>
          </Button>
        </Popover>
      </div>

      <DatabaseSelector
        additionalOptions={
          (loadBalancers ?? []).length > 0 ? [{ id: `${ref}-all`, name: 'API Load Balancer' }] : []
        }
      />
    </div>
  )
}
export default ReportFilterBar
