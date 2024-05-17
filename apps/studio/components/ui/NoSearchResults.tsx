import { Button, cn } from 'ui'

export interface NoSearchResultsProps {
  searchString: string
  onResetFilter?: () => void
  className?: string
}

const NoSearchResults = ({ searchString, onResetFilter, className }: NoSearchResultsProps) => {
  return (
    <div
      className={cn(
        'bg-surface-100 border border-default px-6 py-4 rounded flex items-center justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-sm text-foreground">No results found</p>
        <p className="text-sm text-foreground-light">
          Your search for "{searchString}" did not return any results
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

export default NoSearchResults
