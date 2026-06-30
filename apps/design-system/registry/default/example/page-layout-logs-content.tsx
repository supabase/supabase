'use client'

import { useState } from 'react'
import { Button, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { FilterBar, isGroup, type FilterCondition, type FilterGroup } from 'ui-patterns/FilterBar'

const logs = [
  ['10:42:01.129', 'POST /hello-world', '200', '132ms', 'iad1'],
  ['10:41:47.854', 'POST /hello-world', '200', '118ms', 'syd1'],
  ['10:40:22.381', 'OPTIONS /hello-world', '204', '24ms', 'fra1'],
  ['10:39:58.025', 'POST /hello-world', '500', '96ms', 'iad1'],
] as const

const logFilterProperties = [
  {
    label: 'Request',
    name: 'request',
    type: 'string' as const,
    operators: ['=', '!=', 'CONTAINS'],
  },
  {
    label: 'Status',
    name: 'status',
    type: 'string' as const,
    options: ['200', '204', '500'],
    operators: ['=', '!='],
  },
  {
    label: 'Region',
    name: 'region',
    type: 'string' as const,
    options: ['iad1', 'syd1', 'fra1'],
    operators: ['=', '!='],
  },
]

const initialLogFilters: FilterGroup = {
  logicalOperator: 'AND',
  conditions: [],
}

type LogRow = (typeof logs)[number]

function getLogValue(log: LogRow, propertyName: string) {
  const [, request, status, , region] = log

  switch (propertyName) {
    case 'request':
      return request
    case 'status':
      return status
    case 'region':
      return region
    default:
      return undefined
  }
}

function matchesLogCondition(log: LogRow, condition: FilterCondition) {
  const actualValue = getLogValue(log, condition.propertyName)

  if (actualValue === undefined || condition.value === '' || condition.value === null) {
    return true
  }

  const actual = String(actualValue).toLowerCase()
  const expected = String(condition.value).toLowerCase()

  switch (condition.operator) {
    case '=':
      return actual === expected
    case '!=':
      return actual !== expected
    case 'CONTAINS':
      return actual.includes(expected)
    default:
      return true
  }
}

function matchesLogFilters(log: LogRow, filterGroup: FilterGroup): boolean {
  if (filterGroup.conditions.length === 0) {
    return true
  }

  const conditionMatches = filterGroup.conditions.map((condition) =>
    isGroup(condition) ? matchesLogFilters(log, condition) : matchesLogCondition(log, condition)
  )

  return filterGroup.logicalOperator === 'AND'
    ? conditionMatches.every(Boolean)
    : conditionMatches.some(Boolean)
}

export function PageLayoutLogsContent() {
  const [filters, setFilters] = useState<FilterGroup>(initialLogFilters)
  const [freeformText, setFreeformText] = useState('')
  const normalizedFreeformText = freeformText.trim().toLowerCase()
  const filteredLogs = logs.filter(
    (log) =>
      matchesLogFilters(log, filters) &&
      (normalizedFreeformText === '' ||
        log.some((value) => value.toLowerCase().includes(normalizedFreeformText)))
  )

  return (
    <div className="overflow-hidden bg-surface-75">
      <div className="flex h-12 items-center justify-between border-b bg-surface-100 pl-0 pr-4 xl:pl-0 xl:pr-4">
        <div className="min-w-0 flex-1 pr-4">
          <FilterBar
            filterProperties={logFilterProperties}
            freeformText={freeformText}
            onFreeformTextChange={setFreeformText}
            filters={filters}
            onFilterChange={setFilters}
            variant="pill"
            className="border-0 bg-transparent px-1.5 overflow-visible [&>div>div>div>input]:!text-xs"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="default" size="tiny">
            Live
          </Button>
          <Button variant="default" size="tiny">
            Refresh
          </Button>
        </div>
      </div>

      <Table containerProps={{ className: 'w-full' }}>
        <TableHeader className="[&>tr]:bg-surface-100">
          <TableRow>
            <TableHead className="w-[120px]">Time</TableHead>
            <TableHead>Request</TableHead>
            <TableHead className="w-[80px]">Status</TableHead>
            <TableHead className="w-[100px]">Duration</TableHead>
            <TableHead className="w-[80px]">Region</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.map(([time, request, status, duration, region]) => (
            <TableRow key={`${time}-${region}`}>
              <TableCell className="font-mono text-xs text-foreground-lighter">{time}</TableCell>
              <TableCell className="font-mono text-xs">{request}</TableCell>
              <TableCell
                className={cn(
                  'font-mono text-xs',
                  status === '500' ? 'text-destructive' : 'text-brand'
                )}
              >
                {status}
              </TableCell>
              <TableCell className="font-mono text-xs">{duration}</TableCell>
              <TableCell className="font-mono text-xs text-foreground-lighter">{region}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
