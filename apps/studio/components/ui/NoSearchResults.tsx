import { Button, cn } from 'ui'

export interface NoSearchResultsProps {
  searchString?: string
  withinTableCell?: boolean
  onResetFilter?: () => void
  className?: string
  label?: string
  description?: string
}

export const NoSearchResults = ({
  searchString,
  withinTableCell = false,
  onResetFilter,
  className,
  label,
  description,
}: NoSearchResultsProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        !withinTableCell && 'bg-surface-100 px-4 md:px-6 py-4 rounded-md border border-default',
        className
      )}
    >
      <div className="text-sm flex flex-col gap-y-0.5">
        <p className="text-foreground">{label ?? 'No results found'}</p>
        <p className="text-foreground-lighter">
          {description ?? `Your search for “${searchString}” did not return any results`}
        </p>
      </div>
      {onResetFilter !== undefined && (
        <Button type="default" onClick={() => onResetFilter()}>
          Reset filter
        </Button>
      )}
    </div>
  )
}
