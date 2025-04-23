import { Sort } from 'components/grid/types'
import { SortPopover } from 'components/grid/components/header/sort'
import { formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { useEffect, useState } from 'react'

interface SortPopoverWrapperProps {
  sorts: string[]
  onApplySorts: (sorts: Sort[]) => void
  portal?: boolean
}

const SortPopoverWrapper = ({ sorts, onApplySorts, portal }: SortPopoverWrapperProps) => {
  return <SortPopover portal={portal} onApplySorts={onApplySorts} />
}

export default SortPopoverWrapper
