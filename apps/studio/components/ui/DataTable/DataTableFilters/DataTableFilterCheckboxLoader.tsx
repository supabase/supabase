import { Skeleton } from 'ui'

export const DataTableFilterCheckboxLoader = () => {
  return (
    <div className="grid divide-y rounded-sm border border-border">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-2 px-2 py-2.5">
          <Skeleton className="h-4 w-4 rounded-xs" />
          <Skeleton className="h-4 w-full rounded-xs" />
        </div>
      ))}
    </div>
  )
}
