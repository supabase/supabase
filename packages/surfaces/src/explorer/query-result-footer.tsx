import type { ReactNode } from 'react'

import { ExplorerQueryFooter } from './explorer-query'

interface QueryResultFooterProps {
  count: number
  rowLimit?: number
  /** Host actions on the right, e.g. Studio's download menu or table paging. */
  actions?: ReactNode
  /** Extra status after the row count, e.g. elapsed time. */
  children?: ReactNode
}

export const QueryResultFooter = ({
  count,
  rowLimit,
  actions,
  children,
}: QueryResultFooterProps) => {
  return (
    <ExplorerQueryFooter className="flex items-center justify-between gap-x-2">
      <div className="flex items-center gap-x-2">
        <p>
          {count.toLocaleString()} {count === 1 ? 'row' : 'rows'}
        </p>
        {rowLimit && (
          <>
            <p>·</p>
            <p>{rowLimit < 0 ? 'No row limit' : `Limit ${rowLimit} rows`}</p>
          </>
        )}
        {children}
      </div>
      {actions}
    </ExplorerQueryFooter>
  )
}
