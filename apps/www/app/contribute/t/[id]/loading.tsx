// eslint-disable-next-line no-restricted-exports
export default function Loading() {
  return (
    <div className="mb-6">
      <div className="grid gap-4">
        <div className="border border-border rounded-lg p-4 bg-surface-100 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 bg-muted rounded w-20"></div>
            <div className="h-3 bg-muted rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
