'use client'

import { useState } from 'react'
import { ChevronDown, Database, Search, Shield, Users } from 'lucide-react'
import { EdgeFunctions, Storage } from 'icons'
import { cn, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

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
    placeholder: 'Search database tables...',
    icon: Database,
  },
  {
    value: 'auth-policies',
    label: 'Auth Policies',
    placeholder: 'Search auth policies...',
    icon: Shield,
  },
  {
    value: 'edge-functions',
    label: 'Edge Functions',
    placeholder: 'Search edge functions...',
    icon: EdgeFunctions,
  },
  { value: 'storage', label: 'Storage', placeholder: 'Search storage...', icon: Storage },
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
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-48 p-1" align="start">
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
