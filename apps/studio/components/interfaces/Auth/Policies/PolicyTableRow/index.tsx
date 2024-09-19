import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { noop } from 'lodash'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@ui/components/shadcn/ui/tooltip'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Panel from 'components/ui/Panel'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { Info } from 'lucide-react'
import PolicyRow from './PolicyRow'
import PolicyTableRowHeader from './PolicyTableRowHeader'

interface PolicyTableRowProps {
  table: PostgresTable
  isLocked: boolean
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: () => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyTableRow = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyTableRowProps) => {
  const { project } = useProjectContext()
  const { data } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const policies = (data ?? [])
    .filter((policy) => policy.schema === table.schema && policy.table === table.name)
    .sort((a, b) => a.name.localeCompare(b.name))

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
      {policies.length === 0 && (
        <div className="px-6 py-4 flex flex-col gap-y-3">
          <p className="text-foreground-light text-sm">No policies created yet</p>
        </div>
      )}

      {policies?.map((policy) => (
        <PolicyRow
          key={policy.id}
          policy={policy}
          onSelectEditPolicy={onSelectEditPolicy}
          onSelectDeletePolicy={onSelectDeletePolicy}
        />
      ))}
      {!table.rls_enabled && !isLocked && (
        <div className="bg-surface-200 px-6 py-2 text-xs flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-warning-600 rounded-full" />
          <span className="font-bold text-warning-600">Warning:</span>{' '}
          <span className="text-foreground-light">
            Row Level Security is disabled. Your table is publicly readable and writable.
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 " />
              </TooltipTrigger>
              <TooltipContent className="w-[400px]">
                Anyone with the project's anonymous key can modify or delete your data. Enable RLS
                and create access policies to keep your data secure.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </Panel>
  )
}

export default PolicyTableRow
