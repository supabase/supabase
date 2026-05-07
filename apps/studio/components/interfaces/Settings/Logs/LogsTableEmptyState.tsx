import { Search } from 'lucide-react'

const EmptyStateRow = () => {
  return (
    <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-stronger px-2" />
  )
}

export function LogsTableEmptyState({
  title = 'No results found',
  description = 'Try another search or adjust the filters',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex scale-100 flex-col items-center justify-center gap-6 text-center opacity-100 h-full">
      <div className="flex flex-col gap-1 relative">
        <EmptyStateRow />
        <EmptyStateRow />
        <EmptyStateRow />
        <Search size={30} className="absolute right-3 -bottom-2 text-foreground-lighter" />
      </div>
      <div className="flex flex-col gap-1 px-5">
        <h3 className="text-lg text-foreground">{title}</h3>
        <p className="text-sm max-w-xs text-foreground-lighter">{description}</p>
      </div>
    </div>
  )
}
