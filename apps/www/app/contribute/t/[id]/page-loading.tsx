// eslint-disable-next-line no-restricted-exports
export default function PageLoading() {
  return (
    <div className="border border-border rounded-lg p-8 bg-surface-200">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-8 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
        </div>
      </div>
      <div className="grid gap-4 mb-6">
        <div>
          <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
