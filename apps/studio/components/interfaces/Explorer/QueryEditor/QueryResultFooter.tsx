import { ExplorerQueryFooter } from '../ExplorerQuery'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { pluralize } from '@/lib/helpers'

interface QueryResultFooterProps {
  count: number
  rowLimit?: number
  results?: readonly Record<string, unknown>[]
  fileName?: string
}

export const QueryResultFooter = ({
  count,
  rowLimit,
  results,
  fileName,
}: QueryResultFooterProps) => {
  return (
    <ExplorerQueryFooter className="flex items-center justify-between gap-x-2">
      <div className="flex items-center gap-x-2">
        <p>
          {count.toLocaleString()} {pluralize(count, 'row')}
        </p>
        {rowLimit && (
          <>
            <p>·</p>
            <p>{rowLimit < 0 ? 'No row limit' : `Limit ${rowLimit} rows`}</p>
          </>
        )}
      </div>
      {results && results.length > 0 && (
        <DownloadResultsButton
          enableCopyShortcuts={false}
          align="end"
          variant="text"
          results={results}
          fileName={fileName ?? 'Results'}
        />
      )}
    </ExplorerQueryFooter>
  )
}
