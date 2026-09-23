import { forwardRef, useState } from 'react'

import { QueryCellEditor } from '@/components/interfaces/Explorer/Notebook/QueryCellEditor'
import { type QueryEditorHandle } from '@/components/interfaces/Explorer/QueryEditor'
import { type QueryCell } from '@/data/content/notebooks/notebook-schema'

interface HomeNotebookQueryCellProps {
  cell: QueryCell
}

/** A read-only Home notebook query cell — it can be run here, but is edited in the Explorer. */
export const HomeNotebookQueryCell = forwardRef<QueryEditorHandle, HomeNotebookQueryCellProps>(
  function HomeNotebookQueryCell({ cell }, ref) {
    const [showQuery, setShowQuery] = useState(false)

    return (
      <QueryCellEditor
        ref={ref}
        cell={cell}
        showQuery={showQuery}
        onShowQueryChange={setShowQuery}
      />
    )
  }
)
