import { Button } from 'ui'

import { ExplorerQueryFooter } from '../ExplorerQuery'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { pluralize } from '@/lib/helpers'

interface QueryResultFooterProps {
  count: number
  rowLimit?: number
  results?: readonly Record<string, unknown>[]
  fileName?: string
  /** Present when another page of rows can be appended to the result. */
  onLoadMore?: () => void
  isLoadingMore?: boolean
}

export const QueryResultFooter = ({
  count,
  rowLimit,
  results,
  fileName,
  onLoadMore,
  isLoadingMore = false,
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
        {onLoadMore && (
          <>
            <p>·</p>
            <Button
              variant="text"
              size="tiny"
              className="h-auto px-1 py-0 text-xs"
              loading={isLoadingMore}
              onClick={onLoadMore}
            >
              Load more
            </Button>
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
