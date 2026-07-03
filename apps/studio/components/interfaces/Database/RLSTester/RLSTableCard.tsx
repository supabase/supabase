import { Check, ChevronDown, Edit, X } from 'lucide-react'
import { useMemo } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger, WarningIcon } from 'ui'

import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { type ParseSQLQueryOperations } from '@/data/misc/parse-query-mutation'

interface RLSTableCardProps {
  table: { schema: string; name: string; isRLSEnabled: boolean }
  operation: ParseSQLQueryOperations
  role?: string
  policies: Policy[]
  hasError: boolean
  handleSelectEditPolicy: (policy: Policy) => void
}

export const RLSTableCard = ({
  table,
  operation,
  role,
  policies,
  hasError,
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
          <code className="text-code-inline">{role}</code> role on this table -{' '}
          {operation === 'SELECT'
            ? 'no data will be returned'
            : `no data will be ${operation?.toLowerCase()}${operation?.toLowerCase().endsWith('e') ? 'd' : 'ed'}`}
          .
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
            operation={operation}
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
            operation={operation}
            handleSelectEditPolicy={handleSelectEditPolicy}
          />
        </>
      )
    }

    return (
      <>
        <p>
          {policies.length} {policies.length > 1 ? 'policies apply' : 'policy applies'} for the{' '}
          <code className="text-code-inline">{role}</code> role on this table.{' '}
          {operation === 'SELECT'
            ? `Only rows that match ${policies.length > 1 ? 'these conditions' : 'this condition'} are returned.`
            : `The ${operation} operation will only be successful if the conditions are matched.`}
        </p>
        <TableAccessPolicySummary
          policies={policies}
          operation={operation}
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
    operation,
    handleSelectEditPolicy,
  ])

  return (
    <Collapsible
      className={cn('border rounded-sm', !isRLSEnabled && 'bg-warning-300 border-warning-500')}
    >
      <CollapsibleTrigger className="flex items-center justify-between px-3 py-2 w-full [&[data-state=open]>div>svg]:-rotate-180!">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            {!isRLSEnabled ? (
              <WarningIcon />
            ) : (hasError && operation === 'INSERT') || noPolicies || falseOnlyPolicy ? (
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
          {operation === 'SELECT' && (
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
          )}
          <ChevronDown className="transition-transform duration-200" strokeWidth={1.5} size={14} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'border-t p-3 text-sm text-foreground-light',
          !isRLSEnabled && 'border-warning-500'
        )}
      >
        {tableAccessDescription}
      </CollapsibleContent>
    </Collapsible>
  )
}

const TableAccessPolicySummary = ({
  policies,
  operation,
  handleSelectEditPolicy,
}: {
  policies: Policy[]
  operation: ParseSQLQueryOperations
  handleSelectEditPolicy: (policy: Policy) => void
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
                {operation === 'SELECT' ? 'Show rows' : `Allow ${operation?.toLocaleLowerCase()}s`}{' '}
                where:{' '}
                <code className="text-code-inline text-foreground">
                  {policy.definition ?? policy.check}
                </code>
              </p>
            </div>
            <ButtonTooltip
              variant="text"
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
