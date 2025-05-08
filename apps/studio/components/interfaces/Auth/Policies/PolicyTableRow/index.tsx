import type { PostgresPolicy } from '@supabase/postgres-meta'
import { noop } from 'lodash'
import { Info } from 'lucide-react'

import { Markdown } from 'components/interfaces/Markdown'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import PolicyRow from './PolicyRow'
import PolicyTableRowHeader from './PolicyTableRowHeader'

export interface PolicyTableRowProps {
  table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }
  isLocked: boolean
  onSelectToggleRLS: (table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }) => void
  onSelectCreatePolicy: () => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

export const PolicyTableRow = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyTableRowProps) => {
  const { project } = useProjectContext()

  const { data, error, isLoading, isError, isSuccess } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const policies = (data ?? [])
    .filter((policy) => policy.schema === table.schema && policy.table === table.name)
    .sort((a, b) => a.name.localeCompare(b.name))

  const { data: lints = [] } = useProjectLintsQuery({ projectRef: project?.ref })
  const [rlsLint] = lints.filter(
    (lint) =>
      lint.categories.includes('SECURITY') &&
      lint.metadata?.name === table.name &&
      lint.metadata?.schema === table.schema &&
      (lint.name === 'rls_enabled_no_policy' || lint.name.includes('rls_disabled'))
  )

  return (
    <Panel
      className="!m-0"
      title={
        <PolicyTableRowHeader
          table={table}
          isLocked={isLocked}
          onSelectToggleRLS={onSelectToggleRLS}
          onSelectCreatePolicy={onSelectCreatePolicy}
        />
      }
    >
      {!!rlsLint && (
        <div
          className={cn(
            'dark:bg-alternative-200 bg-surface-200 px-6 py-2 text-xs flex items-center gap-2',
            policies.length === 0 ? '' : 'border-b'
          )}
        >
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              rlsLint.level === 'ERROR' ? 'bg-warning-600' : 'bg-selection'
            )}
          />
          <span className={cn('font-bold', rlsLint.level === 'ERROR' ? 'text-warning-600' : '')}>
            {rlsLint.level === 'ERROR' ? 'Warning' : 'Note'}:
          </span>{' '}
          <Markdown
            className="text-xs text-foreground-light !max-w-full"
            content={`${rlsLint.detail}${rlsLint.level === 'ERROR' ? ' Your table is publicly readable and writable.' : '. No data will be selectable via Supabase APIs.'}`}
          />
          {rlsLint.level === 'ERROR' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent className="w-[400px]">
                Anyone with the project's anonymous key can modify or delete your data. Enable RLS
                and create access policies to keep your data secure.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      {isLoading && (
        <div className="px-6 py-4">
          <ShimmeringLoader />
        </div>
      )}
      {isError && (
        <AlertError
          className="border-0 rounded-none"
          error={error}
          subject="Failed to retrieve policies"
        />
      )}
      {isSuccess && (
        <>
          {policies.length === 0 && (
            <div className="px-6 py-4 flex flex-col gap-y-3">
              <p className="text-foreground-lighter text-sm">No policies created yet</p>
            </div>
          )}
          {policies?.map((policy) => (
            <PolicyRow
              key={policy.id}
              isLocked={isLocked}
              policy={policy}
              onSelectEditPolicy={onSelectEditPolicy}
              onSelectDeletePolicy={onSelectDeletePolicy}
            />
          ))}
        </>
      )}
    </Panel>
  )
}
