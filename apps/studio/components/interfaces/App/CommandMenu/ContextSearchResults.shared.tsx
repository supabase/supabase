'use client'

import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

export interface SearchResult {
  id: string
  name: string
  description?: string
}

export function SkeletonResults() {
  return (
    <div className="p-2 space-y-1">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <ShimmeringLoader className="!w-4 !h-4 !py-0 rounded" delayIndex={i} />
          <div className="flex-1 space-y-1">
            <ShimmeringLoader className="!w-32 !py-1.5" delayIndex={i} />
            <ShimmeringLoader className="!w-48 !py-1" delayIndex={i + 1} />
          </div>
        </div>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  query: string
}

export function EmptyState({ icon: Icon, label, query }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
      <Icon className="h-6 w-6" strokeWidth={1.5} />
      <p className="text-sm">
        {query ? `No results found for "${query}"` : `Type to search in ${label}`}
      </p>
    </div>
  )
}

interface ResultItemProps {
  result: SearchResult
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  onClick?: () => void
}

export function ResultItem({ result, icon: Icon, onClick }: ResultItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-2 py-2 text-left rounded-md transition-colors',
        'hover:bg-surface-200 focus:bg-surface-200 focus:outline-none',
        'group cursor-pointer'
      )}
    >
      <Icon
        className="h-4 w-4 text-foreground-muted group-hover:text-foreground-light transition-colors shrink-0"
        strokeWidth={1.5}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground-light group-hover:text-foreground truncate">
          {result.name}
        </p>
        {result.description && (
          <p className="text-xs text-foreground-muted truncate">{result.description}</p>
        )}
      </div>
    </button>
  )
}
