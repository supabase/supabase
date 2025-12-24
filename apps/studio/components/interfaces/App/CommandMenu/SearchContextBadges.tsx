'use client'

import { Database, Info, Search, Users } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export type SearchContextValue =
  | 'commands'
  | 'users'
  | 'database-tables'
  | 'auth-policies'
  | 'edge-functions'
  | 'storage'

interface SearchContextOption {
  value: SearchContextValue
  label: string
  placeholder: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const SEARCH_CONTEXT_OPTIONS: SearchContextOption[] = [
  {
    value: 'commands',
    label: 'Commands',
    placeholder: 'Run a command or search...',
    icon: Search,
  },
  { value: 'users', label: 'Users', placeholder: 'Search users...', icon: Users },
  {
    value: 'database-tables',
    label: 'Tables',
    placeholder: 'Search in database tables...',
    icon: Database,
  },
  {
    value: 'auth-policies',
    label: 'Policies',
    placeholder: 'Search in auth policies...',
    icon: Auth,
  },
  {
    value: 'edge-functions',
    label: 'Functions',
    placeholder: 'Search in edge functions...',
    icon: EdgeFunctions,
  },
  { value: 'storage', label: 'Storage', placeholder: 'Search in storage...', icon: Storage },
]

interface SearchContextBadgesProps {
  value: SearchContextValue
  onChange: (value: SearchContextValue) => void
}

export function SearchContextBadges({ value, onChange }: SearchContextBadgesProps) {
  return (
    <div className="flex items-center gap-1 px-4 pb-2 pt-1 border-b border-default max-w-full overflow-x-auto">
      <div className="flex items-center gap-1 overflow-x-auto">
        {SEARCH_CONTEXT_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors',
                'border',
                isSelected
                  ? 'bg-surface-300 border-foreground-lighter text-foreground'
                  : 'bg-surface-100 border-strong hover:border-stronger text-foreground-lighter hover:text-foreground-light hover:bg-surface-200'
              )}
            >
              <Icon className="h-3 w-3" strokeWidth={1.5} />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-foreground-lighter hover:text-foreground-light">
            <Info className="h-3.5 min-w-3.5" strokeWidth={1.5} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          Select a context to change what your search term targets. Some contexts may use SQL
          against your project; very large databases could have limitations.
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export function getSearchContextPlaceholder(context: SearchContextValue): string {
  const option = SEARCH_CONTEXT_OPTIONS.find((opt) => opt.value === context)
  return option?.placeholder ?? 'Run a command or search...'
}
