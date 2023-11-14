import { Button } from 'ui'

export interface NoSearchResultsProps {
  searchString: string
  onResetFilter?: () => void
}

const NoSearchResults = ({ searchString, onResetFilter }: NoSearchResultsProps) => {
  return (
    <div className="bg-surface-100 border border-default px-6 py-4 rounded flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-foreground-light">No results found</p>
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
