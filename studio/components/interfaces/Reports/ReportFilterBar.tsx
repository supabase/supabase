import { keyBy } from 'lodash'
import React from 'react'
import { useState } from 'react'
import { Dropdown, Popover, Button, IconPlus, IconChevronDown, Select, Input, IconX } from 'ui'
import DatePickers from '../Settings/Logs/Logs.DatePickers'
import { REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import { ReportFilterItem } from './Reports.types'

interface Props {
  filters: ReportFilterItem[]
  onAddFilter: (filter: ReportFilterItem) => void
  onRemoveFilter: (filter: ReportFilterItem) => void
}

const ReportFilterBar: React.FC<Props> = ({ filters, onAddFilter, onRemoveFilter }) => {
  const filterKeys = ['request.path', 'request.host' , 'response.status_code']
  const [showAdder, setShowAdder] = useState(false)
  const [addFilterValues, setAddFilterValues] = useState<ReportFilterItem>({
    key: filterKeys[0],
    compare: 'is',
    value: '',
  })

  const resetFilterValues = () => {
    setAddFilterValues({
      key: filterKeys[0],
      compare: 'is',
      value: '',
    })
  }

  const handleProductFilterChange = async (
    filterToRemove: ReportFilterItem | null,
    key: string
  ) => {
    if (filterToRemove) {
      await onRemoveFilter(filterToRemove)
    }
    if (key !== 'all') {
      await onAddFilter({
        key: 'request.path',
        compare: 'matches',
        value: `/${key}/`,
      })
    }
  }
  const getPathFilterMatchValue = (filter: ReportFilterItem) => {
    return [...String(filter.value).matchAll(/\/(storage|realtime|auth|functions)\//g)]
  }
  const currentProductFilter =
    filters.find((filter) => {
      const matches = getPathFilterMatchValue(filter)
      if (filter.key == 'request.path' && matches.length > 0) {
        return true
      } else {
        return false
      }
    }) || null

  const currentProductFilterKey = currentProductFilter
    ? getPathFilterMatchValue(currentProductFilter)[0][1]
    : 'all'
  return (
    <div>
      <div className="flex flex-row justify-start items-center flex-wrap gap-2">
        <Dropdown
          size="small"
          side="bottom"
          align="start"
          overlay={
            <>
              <Dropdown.Item onClick={() => handleProductFilterChange(currentProductFilter, 'all')}>
                All
              </Dropdown.Item>
              <Dropdown.Separator />
              {[
                { key: 'rest', label: 'REST' },
                { key: 'auth', label: 'Auth' },
                { key: 'storage', label: 'Storage' },
                { key: 'realtime', label: 'Realtime' },
                { key: 'functions', label: 'Functions' },
                { key: 'graphql', label: 'GraphQL' },
              ].map(({ key, label }) => (
                <Dropdown.Item
                  key={key}
                  disabled={key === currentProductFilterKey}
                  onClick={() => handleProductFilterChange(currentProductFilter, key)}
                >
                  <span className={[key === currentProductFilterKey ? 'font-bold' : ''].join(' ')}>
                    {label}
                  </span>
                </Dropdown.Item>
              ))}
            </>
          }
        >
          <Button
            as="span"
            type="default"
            className="inline-flex flex-row gap-2"
            iconRight={<IconChevronDown size={14} />}
          >
            {currentProductFilterKey === 'all'
              ? 'All'
              : `${currentProductFilterKey
                  .slice(0, 1)
                  .toUpperCase()}${currentProductFilterKey.slice(
                  1,
                  currentProductFilterKey.length
                )}`}
          </Button>
        </Dropdown>
        {filters
          .filter((filter) => filter !== currentProductFilter)
          .map((filter) => (
            <div className="text-xs rounded border border-scale-1100 bg-scale-500 px-1 h-7 flex flex-row justify-center gap-1 items-center">
              {filter.key} {filter.compare} {filter.value}
              <Button
                type="text"
                size="tiny"
                className="!p-0 h-6 w-6 flex flex-row justify-center items-center"
                onClick={() => {
                  onRemoveFilter(filter)
                }}
                icon={<IconX size="tiny" className="text-scale-1100" />}
              >
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        <Popover
          align="end"
          header={
            <div className="flex justify-between items-center py-1">
              <h5 className="text-sm text-scale-1200">Add Filter</h5>

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
          overlay={[
            <div className="px-3 py-3 flex flex-col gap-2">
              <Select
                size="tiny"
                value={addFilterValues.key}
                onChange={(e) => {
                  setAddFilterValues((prev) => ({ ...prev, key: e.target.value }))
                }}
                label="Attribute Filter"
                defaultValue={'request.host'}
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
                onChange={(e) => {
                  setAddFilterValues((prev) => ({ ...prev, value: e.target.value }))
                }}
              />
            </div>,
          ]}
          showClose
        >
          <Button
            type="default"
            size="tiny"
            icon={<IconPlus size="tiny" className={`text-scale-1100 `} />}
          >
            Add filter
          </Button>
        </Popover>
      </div>
    </div>
  )
}
export default ReportFilterBar
