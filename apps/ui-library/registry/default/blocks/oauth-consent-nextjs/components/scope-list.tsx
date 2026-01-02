'use client'

import { CheckCircle2 } from 'lucide-react'

interface ScopeListProps {
  scopes: string[]
}

export function ScopeList({ scopes }: ScopeListProps) {
  const displayScopes =
    scopes.length > 0 ? scopes : ['Access your account information', 'Use MCP tools on your behalf']

  return (
    <ul className="space-y-2">
      {displayScopes.map((scope) => (
        <li key={scope} className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>{scope}</span>
        </li>
      ))}
    </ul>
  )
}
