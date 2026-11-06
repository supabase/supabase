import type { PostgresPolicy } from '@supabase/postgres-meta'
import { cn, Badge, ScrollArea, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { ChevronDown, ShieldCheck, ShieldX, Eye, Plus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface RLSPolicyListProps {
  policies: PostgresPolicy[]
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  isLoading: boolean
}

const OPERATION_ICONS = {
  SELECT: Eye,
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  ALL: ShieldCheck,
}

const COMMAND_COLORS = {
  SELECT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  INSERT: 'bg-green-500/10 text-green-500 border-green-500/20',
  UPDATE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
  ALL: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

export const RLSPolicyList = ({
  policies,
  operation,
  isLoading,
}: RLSPolicyListProps) => {
  const [expandedPolicies, setExpandedPolicies] = useState<Set<number>>(new Set())

  const togglePolicy = (id: number) => {
    setExpandedPolicies((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filter policies relevant to the current operation
  const relevantPolicies = policies.filter(
    (p) => p.command === operation || p.command === 'ALL'
  )
  const otherPolicies = policies.filter(
    (p) => p.command !== operation && p.command !== 'ALL'
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px] text-foreground-lighter">
        Loading policies...
      </div>
    )
  }

  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-foreground-lighter gap-2">
        <ShieldX className="h-8 w-8" />
        <p className="text-center">
          No policies defined for this table.
          <br />
          <span className="text-xs">All operations will be blocked if RLS is enabled.</span>
        </p>
      </div>
    )
  }

  const renderPolicy = (policy: PostgresPolicy, isRelevant: boolean) => {
    const isExpanded = expandedPolicies.has(policy.id)
    const Icon = OPERATION_ICONS[policy.command as keyof typeof OPERATION_ICONS] || ShieldCheck
    const colorClass = COMMAND_COLORS[policy.command as keyof typeof COMMAND_COLORS] || COMMAND_COLORS.ALL

    return (
      <Collapsible
        key={policy.id}
        open={isExpanded}
        onOpenChange={() => togglePolicy(policy.id)}
      >
        <CollapsibleTrigger
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-all',
            'hover:bg-surface-200',
            isRelevant ? 'opacity-100' : 'opacity-50',
            isExpanded && 'bg-surface-200'
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="font-mono text-sm">{policy.name}</span>
            <Badge
              variant="outline"
              className={cn('text-xs border', colorClass)}
            >
              {policy.command}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                policy.action === 'PERMISSIVE'
                  ? 'text-brand border-brand/20'
                  : 'text-destructive border-destructive/20'
              )}
            >
              {policy.action}
            </Badge>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <div className="mt-2 space-y-2 text-sm">
            {/* Roles */}
            <div>
              <span className="text-foreground-lighter">Roles: </span>
              <span className="font-mono">
                {policy.roles.join(', ')}
              </span>
            </div>

            {/* USING expression */}
            {policy.definition && (
              <div>
                <span className="text-foreground-lighter block mb-1">
                  USING (for SELECT/UPDATE/DELETE):
                </span>
                <pre className="bg-surface-100 p-2 rounded text-xs overflow-x-auto">
                  {policy.definition}
                </pre>
              </div>
            )}

            {/* WITH CHECK expression */}
            {policy.check && (
              <div>
                <span className="text-foreground-lighter block mb-1">
                  WITH CHECK (for INSERT/UPDATE):
                </span>
                <pre className="bg-surface-100 p-2 rounded text-xs overflow-x-auto">
                  {policy.check}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="flex flex-col gap-1">
        {/* Relevant policies */}
        {relevantPolicies.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-foreground-lighter mb-2 px-1">
              Applies to {operation} ({relevantPolicies.length})
            </div>
            {relevantPolicies.map((p) => renderPolicy(p, true))}
          </div>
        )}

        {/* Other policies */}
        {otherPolicies.length > 0 && (
          <div>
            <div className="text-xs text-foreground-lighter mb-2 px-1 border-t pt-2">
              Other policies ({otherPolicies.length})
            </div>
            {otherPolicies.map((p) => renderPolicy(p, false))}
          </div>
        )}

        {relevantPolicies.length === 0 && (
          <div className="text-center py-4 text-foreground-lighter text-sm">
            No policies apply to {operation} operations.
            <br />
            <span className="text-xs">
              {policies.length > 0
                ? 'This operation may be blocked.'
                : 'All operations will be blocked if RLS is enabled.'}
            </span>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
