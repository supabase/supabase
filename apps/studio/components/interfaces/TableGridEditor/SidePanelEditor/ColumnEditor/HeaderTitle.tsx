import type { PGColumn, PGTable } from '@supabase/pg-meta'

interface Props {
  table: PGTable
  column?: PGColumn
}

export const HeaderTitle = ({ table, column }: Props) => {
  if (!column) {
    return (
      <>
        <span>Add new column to</span>
        <code className="text-code-inline text-sm! ml-1">{table.name}</code>
      </>
    )
  }
  return (
    <>
      Update column <code className="text-code-inline text-sm!">{column.name}</code> from{' '}
      <code className="text-code-inline text-sm!">{column.table}</code>
    </>
  )
}
