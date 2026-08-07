/**
 * PROTOTYPE — the per-cell source picker.
 *
 * In the real build this is PR E1's controlled `QuerySourceMenu`: same idea,
 * fully driven by props, no editor context. Source is configured per-cell.
 */

import { Check, ChevronDown, Database, ScrollText } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'

import { MOCK_REPLICAS } from './ExplorerPrototype.mocks'
import type { CellSource, LogTimeRange } from './ExplorerPrototype.types'

const RELATIVE_RANGES: Array<{ label: string; range: LogTimeRange }> = [
  { label: 'Last 1 hour', range: { type: 'relative', amount: 1, unit: 'hour' } },
  { label: 'Last 24 hours', range: { type: 'relative', amount: 24, unit: 'hour' } },
  { label: 'Last 7 days', range: { type: 'relative', amount: 7, unit: 'day' } },
]

const ROW_LIMITS = [50, 100, 500, 1000]

export const describeSource = (source: CellSource) => {
  if (source.id === 'database') {
    const replica = MOCK_REPLICAS.find((entry) => entry.identifier === source.parameters.identifier)
    return replica?.label ?? 'Primary database'
  }
  const range = source.parameters.time_range
  if (range.type === 'relative') {
    return `Logs · last ${range.amount} ${range.unit}${range.amount === 1 ? '' : 's'}`
  }
  return `Logs · ${range.from} to ${range.to}`
}

const describeRange = (range: LogTimeRange) =>
  range.type === 'relative'
    ? `Last ${range.amount} ${range.unit}${range.amount === 1 ? '' : 's'}`
    : 'Custom range'

interface QueryCellSourceMenuProps {
  source: CellSource
  rowLimit: number
  disabled?: boolean
  onSourceChange: (source: CellSource) => void
  onRowLimitChange: (rowLimit: number) => void
}

export const QueryCellSourceMenu = ({
  source,
  rowLimit,
  disabled = false,
  onSourceChange,
  onRowLimitChange,
}: QueryCellSourceMenuProps) => {
  const isLogs = source.id === 'logs'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="text"
          size="tiny"
          disabled={disabled}
          icon={isLogs ? <ScrollText size={14} /> : <Database size={14} />}
          iconRight={<ChevronDown size={12} />}
          className="text-foreground-light"
        >
          {describeSource(source)}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Source</DropdownMenuLabel>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <Database size={14} /> Database
            {!isLogs && <Check size={14} className="ml-auto" />}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuRadioGroup
              value={source.id === 'database' ? (source.parameters.identifier ?? 'primary') : ''}
              onValueChange={(identifier) =>
                onSourceChange({ id: 'database', parameters: { identifier } })
              }
            >
              {MOCK_REPLICAS.map((replica) => (
                <DropdownMenuRadioItem key={replica.identifier} value={replica.identifier}>
                  {replica.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <ScrollText size={14} /> Logs
            {isLogs && <Check size={14} className="ml-auto" />}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuLabel>Time range</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={isLogs ? describeRange(source.parameters.time_range) : ''}
              onValueChange={(label) => {
                const match = RELATIVE_RANGES.find((entry) => entry.label === label)
                if (match) onSourceChange({ id: 'logs', parameters: { time_range: match.range } })
              }}
            >
              {RELATIVE_RANGES.map((entry) => (
                <DropdownMenuRadioItem key={entry.label} value={entry.label}>
                  {entry.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                onSourceChange({
                  id: 'logs',
                  parameters: {
                    time_range: {
                      type: 'absolute',
                      from: new Date(Date.now() - 86_400_000).toISOString(),
                      to: new Date().toISOString(),
                    },
                  },
                })
              }
            >
              Custom range…
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Row limit</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(rowLimit)}
          onValueChange={(value) => onRowLimitChange(Number(value))}
        >
          {ROW_LIMITS.map((limit) => (
            <DropdownMenuRadioItem key={limit} value={String(limit)}>
              {limit} rows
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
