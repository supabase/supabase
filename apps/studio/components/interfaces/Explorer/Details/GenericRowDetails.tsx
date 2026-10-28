import { cn } from 'ui'

import { formatRowIdentifiers } from './Details.utils'
import { DetailsProperties, DetailsProperty, DetailsSection } from './DetailsSection'
import type { RowDetailsProps } from './RowDetails'
import { formatCellValue } from '@/components/ui/DataGridResults/DataGridResults.utils'

/** Every column of a row as the result shows it, unsaved edits included. */
export const GenericRowDetails = ({ relation, row, rowIdentifiers }: RowDetailsProps) => {
  const entries = Object.entries(row)

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-y-1 p-4">
        <h3 className="truncate font-mono text-sm text-foreground">
          {formatRowIdentifiers(rowIdentifiers)}
        </h3>
        <p className="truncate text-sm text-foreground-lighter">Row in {relation.name}</p>
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
