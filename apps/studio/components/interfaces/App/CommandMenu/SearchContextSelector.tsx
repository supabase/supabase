'use client'

import { useState } from 'react'
import { ChevronDown, Database, Info, Search, Users } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import {
  cn,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

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
    label: 'Database Tables',
    placeholder: 'Search in database tables...',
    icon: Database,
  },
  {
    value: 'auth-policies',
    label: 'Auth Policies',
    placeholder: 'Search in auth policies...',
    icon: Auth,
  },
  {
    value: 'edge-functions',
    label: 'Edge Functions',
    placeholder: 'Search in edge functions...',
    icon: EdgeFunctions,
  },
  { value: 'storage', label: 'Storage', placeholder: 'Search in storage...', icon: Storage },
]

interface SearchContextSelectorProps {
  value: SearchContextValue
  onChange: (value: SearchContextValue) => void
}

export function SearchContextSelector({ value, onChange }: SearchContextSelectorProps) {
  const [open, setOpen] = useState(false)
  const currentContext = SEARCH_CONTEXT_OPTIONS.find((opt) => opt.value === value)
  const CurrentIcon = currentContext?.icon ?? Search

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger_Shadcn_ asChild>
          <button
            type="button"
            className="group flex items-center gap-0.5 shrink-0 text-foreground-muted hover:text-foreground-light transition-colors"
            aria-label="Select search context"
          >
            <CurrentIcon
              className="h-4 w-4 text-foreground-lighter group-hover:text-foreground-light transition-colors"
              strokeWidth={1.5}
            />
            <ChevronDown className="h-3 w-3" />
          </button>
          {/* <TooltipTrigger asChild>
          </TooltipTrigger> */}
        </PopoverTrigger_Shadcn_>
        {/* <TooltipContent>Search context</TooltipContent> */}
      </Tooltip>
      <PopoverContent_Shadcn_ className="w-48 p-1" align="start">
        <div className="font-mono uppercase text-foreground-lighter w-full px-2 py-1.5 text-xs border-b mb-1.5 flex items-center justify-between">
          <span>Context</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info
                className="!h-3.5 !w-3.5 text-foreground-lighter hover:text-foreground-light"
                strokeWidth={1.5}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              Select a context to change what your search term targets. Some contexts may use SQL
              against your project; very large databases could have limitations.
            </TooltipContent>
          </Tooltip>
        </div>
        {SEARCH_CONTEXT_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'flex group items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm transition-colors hover:text-foreground',
                'hover:bg-surface-200',
                isSelected && 'bg-surface-200 text-foreground'
              )}
            >
              <Icon
                className="!h-4 !w-4 text-foreground-lighter group-hover:text-foreground transition-colors"
                strokeWidth={1.5}
              />
              <span>{option.label}</span>
            </button>
          )
        })}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export function getSearchContextPlaceholder(context: SearchContextValue): string {
  const option = SEARCH_CONTEXT_OPTIONS.find((opt) => opt.value === context)
  return option?.placeholder ?? 'Run a command or search...'
}
