import { type PostgresPolicy } from '@supabase/postgres-meta'
import { Check, ChevronDown, Edit, X } from 'lucide-react'
import { useMemo } from 'react'
import {
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  WarningIcon,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface RLSTableCardProps {
  table: { schema: string; name: string; isRLSEnabled: boolean }
  role?: string
  policies: PostgresPolicy[]
  handleSelectEditPolicy: (policy: PostgresPolicy) => void
}

export const RLSTableCard = ({
  table,
  role,
  policies,
  handleSelectEditPolicy,
}: RLSTableCardProps) => {
  const { schema, name, isRLSEnabled } = table
  const trueOnlyPolicy = policies.find((x) => x.definition === 'true')
  const falseOnlyPolicy = policies.find((x) => x.definition === 'false')
  const noPolicies = isRLSEnabled && policies.length === 0

  const tableAccessDescription = useMemo(() => {
    if (!isRLSEnabled) {
      return (
        <p>
          RLS is disabled and all data is publicly accessible. We highly recommend enabling RLS and
          adding policies to restrict access.
        </p>
      )
    }

    if (noPolicies) {
      return (
        <p>
          RLS is enabled but no policies exist for the{' '}
          <code className="text-code-inline">{role}</code> role on this table - no data will be
          returned.
        </p>
      )
    }

    if (trueOnlyPolicy) {
      return (
        <>
          <p>
            The policy "{trueOnlyPolicy.name}" for the{' '}
            <code className="text-code-inline">{role}</code> role on this table evaluates to{' '}
            <code className="text-code-inline">true</code>, so all data from this query is
            accessible to this user.
          </p>
          <TableAccessPolicySummary
            policies={policies}
            handleSelectEditPolicy={handleSelectEditPolicy}
          />
        </>
      )
    }

    if (falseOnlyPolicy) {
      return (
        <>
          <p>
            The policy "{falseOnlyPolicy.name}" for the{' '}
            <code className="text-code-inline">{role}</code> role on this table evaluates to{' '}
            <code className="text-code-inline">false</code>, so no data from this query is
            accessible to this user.
          </p>
          <TableAccessPolicySummary
            policies={policies}
            handleSelectEditPolicy={handleSelectEditPolicy}
          />
        </>
      )
    }

    return (
      <>
        <p>
          {policies.length} {policies.length > 1 ? 'policies apply' : 'policy applies'} for the{' '}
          <code className="text-code-inline">{role}</code> role on this table. Only rows that match{' '}
          {policies.length > 1 ? 'these conditions' : 'this condition'} are returned.
        </p>
        <TableAccessPolicySummary
          policies={policies}
          handleSelectEditPolicy={handleSelectEditPolicy}
        />
      </>
    )
  }, [
    isRLSEnabled,
    noPolicies,
    trueOnlyPolicy,
    falseOnlyPolicy,
    policies,
    role,
    handleSelectEditPolicy,
  ])

  return (
    <Collapsible_Shadcn_
      className={cn('border rounded-sm', !isRLSEnabled && 'bg-warning-300 border-warning-500')}
    >
      <CollapsibleTrigger_Shadcn_ className="flex items-center justify-between px-3 py-2 w-full [&[data-state=open]>div>svg]:-rotate-180!">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            {!isRLSEnabled ? (
              <WarningIcon />
            ) : noPolicies || falseOnlyPolicy ? (
              <X size={16} className="text-destructive" />
            ) : (
              <Check size={16} className="text-brand" />
            )}
            <p className={cn('text-xs font-mono', !isRLSEnabled && 'font-medium text-foreground')}>
              {schema}.{name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <p
            className={cn(
              'text-xs text-foreground-light w-max',
              !isRLSEnabled && 'text-foreground'
            )}
          >
            {noPolicies || falseOnlyPolicy
              ? 'Returns no rows'
              : !isRLSEnabled || !!trueOnlyPolicy
                ? 'Returns all rows'
                : null}
          </p>
          <ChevronDown className="transition-transform duration-200" strokeWidth={1.5} size={14} />
        </div>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_
        className={cn(
          'border-t p-3 text-sm text-foreground-light',
          !isRLSEnabled && 'border-warning-500'
        )}
      >
        {tableAccessDescription}
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}

const TableAccessPolicySummary = ({
  policies,
  handleSelectEditPolicy,
}: {
  policies: PostgresPolicy[]
  handleSelectEditPolicy: (policy: PostgresPolicy) => void
}) => {
  return (
    <div className="border rounded-sm mt-4">
      <p className="text-xs font-mono text-foreground-light uppercase border-b px-3 py-2">
        {policies.length} {policies.length > 1 ? 'policies' : 'policy'} applied
      </p>
      <ul>
        {policies.map((policy) => (
          <li key={policy.id} className="px-3 py-2 flex justify-between items-center">
            <div>
              <p>{policy.name}</p>
              <p className="text-foreground-lighter">
                Show rows where:{' '}
                <code className="text-code-inline text-foreground">{policy.definition}</code>
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
    </div>
  )
}
