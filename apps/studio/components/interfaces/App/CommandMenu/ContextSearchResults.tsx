'use client'

import { useEffect, useState } from 'react'
import { Database, Users } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import { cn } from 'ui'
import { ShimmeringLoader } from 'components/ui/ShimmeringLoader'
import type { SearchContextValue } from './ContextSearchCommands'

interface SearchResult {
  id: string
  name: string
  description?: string
}

interface ContextSearchResultsProps {
  context: SearchContextValue
  query: string
}

const CONTEXT_CONFIG: Record<
  Exclude<SearchContextValue, 'commands'>,
  {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
    /** If true, requires user input before showing results */
    requiresInput?: boolean
  }
> = {
  users: {
    icon: Users,
    label: 'Users',
    requiresInput: true,
  },
  'database-tables': {
    icon: Database,
    label: 'Database Tables',
    requiresInput: true,
  },
  'auth-policies': {
    icon: Auth,
    label: 'Auth Policies',
  },
  'edge-functions': {
    icon: EdgeFunctions,
    label: 'Edge Functions',
  },
  storage: {
    icon: Storage,
    label: 'Storage',
  },
}

// Mock data for different contexts
const MOCK_RESULTS: Record<Exclude<SearchContextValue, 'commands'>, SearchResult[]> = {
  users: [
    { id: '1', name: 'john@example.com', description: 'User ID: abc-123' },
    { id: '2', name: 'jane@example.com', description: 'User ID: def-456' },
    { id: '3', name: 'admin@example.com', description: 'User ID: ghi-789' },
  ],
  'database-tables': [
    { id: '1', name: 'public.users', description: '12 columns • 1,234 rows' },
    { id: '2', name: 'public.posts', description: '8 columns • 5,678 rows' },
    { id: '3', name: 'public.comments', description: '6 columns • 9,012 rows' },
  ],
  'auth-policies': [
    { id: '1', name: 'Users can view own data', description: 'SELECT on public.users' },
    { id: '2', name: 'Users can update own profile', description: 'UPDATE on public.profiles' },
    { id: '3', name: 'Admins have full access', description: 'ALL on public.* (admin role)' },
  ],
  'edge-functions': [
    { id: '1', name: 'send-email', description: 'Last deployed: 2 days ago' },
    { id: '2', name: 'process-webhook', description: 'Last deployed: 1 week ago' },
    { id: '3', name: 'generate-report', description: 'Last deployed: 3 days ago' },
  ],
  storage: [
    { id: '1', name: 'avatars', description: 'Public bucket • 234 files' },
    { id: '2', name: 'documents', description: 'Private bucket • 567 files' },
    { id: '3', name: 'uploads', description: 'Public bucket • 890 files' },
  ],
}

function SkeletonResults() {
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

function EmptyState({
  context,
  query,
}: {
  context: Exclude<SearchContextValue, 'commands'>
  query: string
}) {
  const config = CONTEXT_CONFIG[context]
  const Icon = config.icon

  return (
    <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
      <Icon className="h-6 w-6" strokeWidth={1.5} />
      <p className="text-sm">
        {query ? `No results found for "${query}"` : `Type to search in ${config.label}`}
      </p>
    </div>
  )
}

function ResultItem({
  result,
  context,
}: {
  result: SearchResult
  context: Exclude<SearchContextValue, 'commands'>
}) {
  const config = CONTEXT_CONFIG[context]
  const Icon = config.icon

  return (
    <button
      type="button"
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

export function ContextSearchResults({ context, query }: ContextSearchResultsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  const config = context !== 'commands' ? CONTEXT_CONFIG[context] : null
  const requiresInput = config?.requiresInput ?? false

  // Mock loading and filtering
  useEffect(() => {
    if (context === 'commands') return

    // Don't search if query is empty and context requires input
    if (!query.trim() && requiresInput) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setResults([])

    // Simulate API call delay
    const timer = setTimeout(() => {
      const mockData = MOCK_RESULTS[context] || []
      const filtered = query.trim()
        ? mockData.filter(
            (item) =>
              item.name.toLowerCase().includes(query.toLowerCase()) ||
              item.description?.toLowerCase().includes(query.toLowerCase())
          )
        : mockData
      setResults(filtered)
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [context, query, requiresInput])

  if (context === 'commands') return null

  // Show empty state immediately if no query and context requires input
  if (!query.trim() && requiresInput) {
    return <EmptyState context={context} query="" />
  }

  if (isLoading) {
    return <SkeletonResults />
  }

  if (results.length === 0) {
    return <EmptyState context={context} query={query} />
  }

  return (
    <div className="p-2 space-y-0.5 overflow-y-auto max-h-[300px]">
      {results.map((result) => (
        <ResultItem key={result.id} result={result} context={context} />
      ))}
    </div>
  )
}
