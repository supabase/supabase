import { diffRemoteAuthConfig, diffRemotePostgrestConfig, type PromotableConfigChange } from '@supabase-dx/config'
import { ArrowRight, Wind } from 'lucide-react'
import { useMemo } from 'react'
import { Badge, Skeleton } from 'ui'

import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(not set)'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

interface EnvironmentVariablesDiffPanelProps {
  branchRef?: string
  parentProjectRef?: string
}

export const EnvironmentVariablesDiffPanel = ({
  branchRef,
  parentProjectRef,
}: EnvironmentVariablesDiffPanelProps) => {
  const { data: branchAuth, isPending: isBranchAuthPending } = useAuthConfigQuery({
    projectRef: branchRef,
  })
  const { data: mainAuth, isPending: isMainAuthPending } = useAuthConfigQuery({
    projectRef: parentProjectRef,
  })
  const { data: branchPostgrest, isPending: isBranchPostgrestPending } =
    useProjectPostgrestConfigQuery({ projectRef: branchRef })
  const { data: mainPostgrest, isPending: isMainPostgrestPending } =
    useProjectPostgrestConfigQuery({ projectRef: parentProjectRef })

  const isLoading =
    isBranchAuthPending || isMainAuthPending || isBranchPostgrestPending || isMainPostgrestPending

  const authDiffs = useMemo<PromotableConfigChange[]>(() => {
    if (!branchAuth || !mainAuth) return []
    return diffRemoteAuthConfig(
      branchAuth as Record<string, unknown>,
      mainAuth as Record<string, unknown>
    )
  }, [branchAuth, mainAuth])

  const apiDiffs = useMemo<PromotableConfigChange[]>(() => {
    if (!branchPostgrest || !mainPostgrest) return []
    return diffRemotePostgrestConfig(
      branchPostgrest as Record<string, unknown>,
      mainPostgrest as Record<string, unknown>
    )
  }, [branchPostgrest, mainPostgrest])

  const allDiffs = useMemo(
    () => [
      ...authDiffs.map((d) => ({ ...d, section: 'auth' })),
      ...apiDiffs.map((d) => ({ ...d, section: 'api' })),
    ],
    [authDiffs, apiDiffs]
  )

  if (isLoading) return <Skeleton className="h-64" />

  if (allDiffs.length === 0) {
    return (
      <div className="p-6 text-center">
        <Wind size={32} strokeWidth={1.5} className="text-foreground-muted mx-auto mb-8" />
        <h3 className="mb-1">No promotable config changes</h3>
        <p className="text-sm text-foreground-light">
          Any promotable configuration changes between branches will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-xs text-foreground-lighter uppercase tracking-wide font-medium">
          {allDiffs.length} change{allDiffs.length !== 1 ? 's' : ''} will be promoted to production
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden divide-y divide-border">
        {allDiffs.map((diff) => {
          const from = formatValue(diff.from)
          const to = formatValue(diff.to)
          return (
            <div
              key={`${diff.section}.${diff.key}`}
              className="flex items-center gap-4 px-4 py-3 bg-surface-100 hover:bg-surface-200 transition-colors"
            >
              {/* Key */}
              <p className="font-mono text-xs text-foreground w-64 shrink-0 truncate" title={`${diff.section}.${diff.key}`}>
                {diff.section}.{diff.key}
              </p>

              {/* Before → After */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="warning" className="font-mono truncate max-w-[180px]">{from}</Badge>
                <ArrowRight size={12} className="text-foreground-muted shrink-0" />
                <Badge variant="success" className="font-mono truncate max-w-[180px]">{to}</Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
