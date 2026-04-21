import { PostgresPolicy } from '@supabase/postgres-meta'
import { Check, ChevronDown, Edit, Loader2, X } from 'lucide-react'
import { useMemo } from 'react'
import {
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  WarningIcon,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { type ParseSQLQueryResponse } from '@/data/misc/parse-query-mutation'
import { useTableQuery } from '@/data/tables/table-retrieve-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface RLSTableCardProps {
  schema: string
  table: string
  role?: string
  operation: ParseSQLQueryResponse['operation']
  handleSelectEditPolicy: (policy: PostgresPolicy) => void
}

export const RLSTableCard = ({
  schema,
  table,
  role,
  operation,
  handleSelectEditPolicy,
}: RLSTableCardProps) => {
  const { data: project } = useSelectedProjectQuery()

  const { data, isLoading: isLoadingTable } = useTableQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema,
    name: table,
  })

  const { data: policies = [] } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isRLSEnabled = data?.rls_enabled
  const tablePolicies = policies.filter(
    (x) =>
      x.schema === schema &&
      x.table === table &&
      x.roles.includes(role ?? '') &&
      x.command === operation
  )
  const trueOnlyPolicy = tablePolicies.find((x) => x.definition === 'true')
  const noPolicies = isRLSEnabled && tablePolicies.length === 0

  const tableAccessDescription = useMemo(() => {
    if (!isRLSEnabled) {
      return (
        <>
          RLS is disabled and all data is publicly accessible. We highly recommend enabling RLS and
          adding policies to restrict access.
        </>
      )
    }

    if (noPolicies) {
      return (
        <>
          RLS is enabled but no policies exist for the{' '}
          <code className="text-code-inline">{role}</code> role on this table - no data will be
          returned.
        </>
      )
    }

    return (
      <>
        {!!trueOnlyPolicy ? (
          <p>
            A policy exists for the <code className="text-code-inline">{role}</code> role on this
            table that evaluates to <code className="text-code-inline">true</code>, so all data is
            accessible to the role.
          </p>
        ) : (
          <p>
            {tablePolicies.length} {tablePolicies.length > 1 ? 'policies apply' : 'policy applies'}{' '}
            for the <code className="text-code-inline">{role}</code> role on this table. Only rows
            that match {tablePolicies.length > 1 ? 'these conditions' : 'this condition'} are
            returned.
          </p>
        )}

        <p className="text-xs font-mono text-foreground-light uppercase mt-4 mb-2">
          Evaluated policies
        </p>
        <ul className="border rounded">
          {tablePolicies.map((policy) => (
            <li key={policy.id} className="px-3 py-2 flex justify-between items-center">
              <div>
                <p>{policy.name}</p>
                <p className="text-foreground-lighter">
                  Show rows where:{' '}
                  <span className="text-foreground font-mono text-xs">{policy.definition}</span>
                </p>
              </div>
              <ButtonTooltip
                type="text"
                icon={<Edit />}
                className="w-7"
                tooltip={{ content: { side: 'bottom', text: 'Edit policy' } }}
                onClick={() => {
                  handleSelectEditPolicy(policy)
                }}
              />
            </li>
          ))}
        </ul>
      </>
    )
  }, [isRLSEnabled, noPolicies, trueOnlyPolicy, role, tablePolicies, handleSelectEditPolicy])

  return (
    <Collapsible_Shadcn_ className="border rounded">
      <CollapsibleTrigger_Shadcn_ className="flex items-center justify-between px-3 py-2 w-full [&[data-state=open]>div>svg]:!-rotate-180">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            {isLoadingTable ? (
              <Loader2 size={16} className="animate-spin" />
            ) : !isRLSEnabled ? (
              <WarningIcon />
            ) : noPolicies ? (
              <X size={16} className="text-destructive" />
            ) : (
              <Check size={16} className="text-brand" />
            )}
            <p className="text-xs font-mono">
              {schema}.{table}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <p className="text-xs text-foreground-light w-max">
            {noPolicies
              ? 'No rows returned'
              : !isRLSEnabled || !!trueOnlyPolicy
                ? 'All rows returned'
                : 'Some rows returned'}
          </p>
          <ChevronDown className="transition-transform duration-200" strokeWidth={1.5} size={14} />
        </div>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_ className="border-t p-3 text-sm">
        {tableAccessDescription}
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}
