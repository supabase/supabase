import { Button, cn } from 'ui'

import { formatRowIdentifiers } from './Details.utils'
import { DetailsProperties, DetailsProperty, DetailsSection } from './DetailsSection'
import type { RowDetailsProps } from './RowDetails'
import { RowDetailsBackButton } from './RowDetailsBackButton'
import { formatCellValue } from '@/components/ui/DataGridResults/DataGridResults.utils'

/** Every column of a row as the result shows it, unsaved edits included. */
export const GenericRowDetails = ({
  relation,
  row,
  rowIdentifiers,
  onBack,
  onEdit,
}: RowDetailsProps) => {
  const entries = Object.entries(row)
  // The key's values alone read as the row's name; the columns they belong to are on hover.
  const rowName = Object.values(rowIdentifiers).map(formatCellValue).join(', ')

  return (
    <div className="flex flex-col">
      <header className="flex items-center gap-x-2 p-4">
        {onBack && <RowDetailsBackButton relationName={relation.name} onClick={onBack} />}
        <div className="flex min-w-0 flex-1 flex-col gap-y-1">
          <h3
            className="truncate font-mono text-sm text-foreground"
            title={formatRowIdentifiers(rowIdentifiers)}
          >
            {rowName}
          </h3>
          <p className="truncate text-sm text-foreground-lighter">Row in {relation.name}</p>
        </div>
        {onEdit && (
          <Button variant="default" size="tiny" className="ml-2 shrink-0" onClick={onEdit}>
            Edit row
          </Button>
        )}
      </header>
      <DetailsSection title="Columns" count={entries.length}>
        <DetailsProperties>
          {entries.map(([column, value]) => {
            const formatted = formatCellValue(value)
            return (
              <DetailsProperty key={column} label={column}>
                <span
                  title={formatted}
                  className={cn('truncate', value === null && 'text-foreground-muted')}
                >
                  {formatted}
                </span>
              </DetailsProperty>
            )
          })}
        </DetailsProperties>
      </DetailsSection>
    </div>
  )
}
