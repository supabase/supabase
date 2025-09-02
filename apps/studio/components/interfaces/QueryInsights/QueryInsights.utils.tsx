import { ArrowDown, ArrowUp } from 'lucide-react'
import { Column } from 'react-data-grid'

import { Badge, CodeBlock, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'
import { type InsightsQuery } from 'data/query-insights/insights-queries-query'
import { ColumnConfiguration, QUERY_INSIGHTS_TABLE_COLUMNS } from './QueryInsights.constants'
import { WarningIcon } from 'ui'

export const formatNumberWithCommas = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '0'
  const numberValue = typeof num === 'string' ? parseFloat(num) : num

  if (isNaN(numberValue)) return '0'

  return numberValue.toLocaleString('en-US')
}

export const formatQueryInsightsColumns = ({
  config,
  visibleColumns = [],
  sort,
  onSortChange,
}: {
  config: ColumnConfiguration[]
  visibleColumns?: string[]
  sort?: { column: string; order: 'asc' | 'desc' }
  onSortChange: (column: string) => void
}) => {
  const columnOrder = config.map((c) => c.id) ?? QUERY_INSIGHTS_TABLE_COLUMNS.map((c) => c.id)

  let gridColumns = QUERY_INSIGHTS_TABLE_COLUMNS.map((col) => {
    const savedConfig = config.find((c) => c.id === col.id)
    const res: Column<InsightsQuery> = {
      key: col.id,
      name: col.name,
      resizable: col.resizable ?? true,
      width: savedConfig?.width ?? col.width,
      minWidth: col.minWidth ?? 120,
      headerCellClass: col.id === 'query' ? 'first:pl-6 cursor-pointer' : 'cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange(col.id)}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">{col.name}</p>
            </div>
            {sort?.column === col.id && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.[col.id as keyof InsightsQuery]

        if (col.id === 'query') {
          const slownessRating = props.row?.slowness_rating
          const shouldShowWarning =
            slownessRating === 'NOTICEABLE' ||
            slownessRating === 'SLOW' ||
            slownessRating === 'CRITICAL'

          return (
            <div className="w-full flex items-center gap-x-4">
              {shouldShowWarning && (
                <span className="flex-1 flex">
                  <Tooltip>
                    <TooltipTrigger>
                      <WarningIcon />
                    </TooltipTrigger>
                    <TooltipContent className="min-w-52">
                      <h4 className="font-mono uppercase text-foreground-light text-xs pt-1 pb-1.5">
                        Latency Advisor
                      </h4>
                      <div className="flex flex-col gap-y-1 divide-y divide-dotted [&>div]:py-1.5 [&>div]:flex [&>div]:items-center [&>div]:justify-between">
                        <div>
                          <span className="text-foreground-lighter font-mono">Slowness</span>
                          <span
                            className={cn(
                              'capitalize',
                              slownessRating === 'NOTICEABLE' && 'text-warning',
                              slownessRating === 'SLOW' && 'text-warning',
                              slownessRating === 'CRITICAL' && 'text-destructive'
                            )}
                          >
                            {slownessRating?.toLowerCase()}
                          </span>
                        </div>
                        {props.row?.health_score !== undefined && (
                          <div>
                            <span className="text-foreground-lighter font-mono">Health score</span>
                            <span>{props.row?.health_score?.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </span>
              )}
              <CodeBlock
                language="sql"
                className="!bg-transparent !p-0 !m-0 !border-none !whitespace-nowrap [&>code]:!whitespace-nowrap [&>code]:break-words !overflow-visible line-clamp-1"
                hideLineNumbers
                hideCopy
                value={value as string}
                wrapLines={false}
              />
            </div>
          )
        }

        if (col.id === 'calls') {
          const formattedValue = (value as number)?.toLocaleString() || ''
          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{formattedValue}</p>
            </div>
          )
        }

        if (col.id === 'total_time') {
          const formattedValue = value ? `${(value as number).toFixed(0)}ms` : ''
          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{formattedValue}</p>
              {value && (
                <p className="text-foreground-lighter">{((value as number) / 1000).toFixed(2)}s</p>
              )}
            </div>
          )
        }

        if (col.id === 'mean_exec_time') {
          const formattedValue = value ? `${(value as number).toFixed(0)}ms` : ''
          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{formattedValue}</p>
              {value && (
                <p className="text-foreground-lighter">{((value as number) / 1000).toFixed(2)}s</p>
              )}
            </div>
          )
        }

        if (col.id === 'rows_read') {
          const formattedValue = (value as number)?.toLocaleString() || ''
          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{formattedValue}</p>
            </div>
          )
        }

        if (col.id === 'avg_p90') {
          const formattedValue = value ? `${(value as number).toFixed(0)}ms` : ''
          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{formattedValue}</p>
              {value && (
                <p className="text-foreground-lighter">{((value as number) / 1000).toFixed(2)}s</p>
              )}
            </div>
          )
        }

        if (col.id === 'avg_p95') {
          const formattedValue = value ? `${(value as number).toFixed(0)}ms` : ''
          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{formattedValue}</p>
              {value && (
                <p className="text-foreground-lighter">{((value as number) / 1000).toFixed(2)}s</p>
              )}
            </div>
          )
        }

        if (col.id === 'health_score') {
          const formattedValue = value ? (value as number).toFixed(2) : ''
          const scoreValue = value as number

          let textColor = ''
          if (scoreValue > 100) {
            textColor = 'text-destructive'
          } else if (scoreValue > 10) {
            textColor = 'text-warning'
          }

          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p className={textColor}>{formattedValue}</p>
            </div>
          )
        }

        if (col.id === 'total_cost_before') {
          const costValue = typeof value === 'string' ? parseFloat(value) : (value as number)
          const numericValue = isNaN(costValue) ? 0 : costValue
          const formattedValue = numericValue.toFixed(2)

          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{formattedValue}</p>
            </div>
          )
        }

        if (col.id === 'last_run') {
          if (!value)
            return (
              <div className="w-full flex flex-col justify-center font-mono text-xs text-center">
                <p className="text-foreground-lighter">-</p>
              </div>
            )

          const date = new Date(value as string)
          const formattedValue = date.toLocaleString()
          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{formattedValue}</p>
            </div>
          )
        }

        if (col.id === 'index_advisor') {
          const isOptimized = props.row?.is_optimized

          if (isOptimized) {
            return (
              <div className="w-full flex-col justify-center font-mono text-xs inline-flex">
                <span>
                  <Badge
                    variant="success"
                    className="text-xs !text-center !inline-flex items-center"
                  >
                    Optimized
                  </Badge>
                </span>
              </div>
            )
          } else {
            return (
              <div className="w-full flex-col justify-center font-mono text-xs inline-flex">
                <span>
                  <Badge
                    variant="warning"
                    className="text-xs !text-center !inline-flex items-center"
                  >
                    Not optimized
                  </Badge>
                </span>
              </div>
            )
          }
        }

        return (
          <div className="w-full flex flex-col justify-center font-mono text-xs">
            <p>{value}</p>
          </div>
        )
      },
    }
    return res
  })

  if (visibleColumns.length > 0) {
    gridColumns = gridColumns.filter((col) => visibleColumns.includes(col.key))
  }

  gridColumns.sort((a, b) => {
    const aIndex = columnOrder.indexOf(a.key)
    const bIndex = columnOrder.indexOf(b.key)
    return aIndex - bIndex
  })

  return gridColumns
}
