'use client'

import { CommandList_Shadcn_, cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import { CommandItem } from 'ui-patterns/CommandMenu/internal/Command'
import { CommandGroup } from 'ui-patterns/CommandMenu/internal/CommandGroup'
import { TextHighlighter } from 'ui-patterns/CommandMenu'
import type { IRouteCommand, IActionCommand } from 'ui-patterns/CommandMenu/internal/types'

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

interface ResultsListProps {
  results: SearchResult[]
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  getIcon?: (result: SearchResult) => React.ComponentType<React.SVGProps<SVGSVGElement>>
  onResultClick?: (result: SearchResult) => void
  getRoute?: (result: SearchResult) => `/${string}` | `http${string}`
  className?: string
}

export function ResultsList({
  results,
  icon: Icon,
  getIcon,
  onResultClick,
  getRoute,
  className,
}: ResultsListProps) {
  const commands = results.map((result): IRouteCommand | IActionCommand => {
    const ResultIcon = getIcon ? getIcon(result) : Icon
    const baseCommand = {
      id: result.id,
      name: result.name,
      value: result.description ? `${result.name} ${result.description}` : result.name,
      icon: () => <ResultIcon className="h-4 w-4" strokeWidth={1.5} />,
    }

    if (getRoute) {
      return {
        ...baseCommand,
        route: getRoute(result),
      } as IRouteCommand
    }

    return {
      ...baseCommand,
      action: () => onResultClick?.(result),
    } as IActionCommand
  })

  return (
    <CommandList_Shadcn_
      className={cn(
        '!max-h-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-transparent',
        className
      )}
    >
      <CommandGroup>
        {commands.map((command) => (
          <CommandItem key={command.id} command={command}>
            <div className="flex flex-col min-w-0 text-foreground-light">
              <TextHighlighter>{command.name}</TextHighlighter>
              {command.value && command.value !== command.name && (
                <p className="text-xs text-foreground-lighter/70 truncate mt-0.5">
                  {command.value.replace(command.name, '').trim()}
                </p>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList_Shadcn_>
  )
}
