export const TablePickerSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-xl border border-default bg-surface-100 animate-pulse"
        >
          <div className="relative overflow-hidden bg-surface-200/50 px-4 py-3 border-b border-default">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-foreground-lighter/30" />
              <div className="h-4 w-24 rounded bg-foreground-lighter/30" />
            </div>
          </div>

          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((fieldIndex) => (
              <div key={fieldIndex} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-foreground-lighter/20" />
                <div className="flex-1 h-3 rounded bg-foreground-lighter/20" />
                <div className="w-12 h-3 rounded bg-foreground-lighter/20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}