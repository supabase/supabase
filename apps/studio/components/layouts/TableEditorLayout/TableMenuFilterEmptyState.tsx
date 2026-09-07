import { Button } from 'ui'
import { InnerSideBarEmptyPanel } from 'ui-patterns/InnerSideMenu'

export const TableMenuFilterEmptyState = ({ onResetFilters }: { onResetFilters: () => void }) => {
  return (
    <InnerSideBarEmptyPanel
      title="No results based on filters"
      description="All entity types are hidden."
      className="mx-4"
    >
      <Button variant="default" onClick={onResetFilters} className="mt-2">
        Reset filters
      </Button>
    </InnerSideBarEmptyPanel>
  )
}
