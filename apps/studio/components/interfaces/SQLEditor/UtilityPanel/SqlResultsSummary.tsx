import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface SqlResultsSummaryProps {
  rowCount: number
  autoLimit?: number
}

export function SqlResultsSummary({ rowCount, autoLimit }: SqlResultsSummaryProps) {
  return (
    <p className="flex min-w-0 items-center truncate text-xs text-foreground-lighter">
      {autoLimit !== undefined ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate text-foreground">
              {rowCount} row{rowCount > 1 ? 's' : ''}
              <span className="text-foreground-lighter ml-1">
                {` (Limited to only ${autoLimit} rows)`}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="flex flex-col gap-y-1">
              <span>
                Results are limited to preserve browser performance when a query returns many rows.
              </span>
              <span className="text-foreground-light">
                Change or remove this limit from the dropdown near Run.
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="truncate text-foreground">
          {rowCount} row{rowCount > 1 ? 's' : ''}
        </span>
      )}
    </p>
  )
}
