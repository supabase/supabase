import { type PostgresPolicy } from '@supabase/postgres-meta'
import {
  Badge,
  cn,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { Results } from '../../SQLEditor/UtilityPanel/Results'
import { RLSTableCard } from './RLSTableCard'
import { ParseQueryResults } from './RLSTester.types'
import { useTestQueryRLS } from './useTestQueryRLS'

interface RLSTesterResultsProps {
  results: Object[]
  autoLimit: boolean
  parseQueryResults: ParseQueryResults
  handleSelectEditPolicy: (policy: PostgresPolicy) => void
}

export const RLSTesterResults = ({
  results,
  autoLimit,
  parseQueryResults,
  handleSelectEditPolicy,
}: RLSTesterResultsProps) => {
  const { limit } = useTestQueryRLS()

  const isServiceRole = parseQueryResults?.role === undefined
  const tableWithRLSEnabledButNoPolicies = parseQueryResults?.tables.find(
    (x) => x.isRLSEnabled && x.tablePolicies.length === 0
  )
  const tableWithRLSEnabledWithPolicyFalse = parseQueryResults?.tables.find(
    (x) => x.isRLSEnabled && x.tablePolicies.some((y) => y.definition === 'false')
  )

  const noAccessToData =
    !isServiceRole && (!!tableWithRLSEnabledButNoPolicies || !!tableWithRLSEnabledWithPolicyFalse)

  return (
    <div className="p-5 pt-4">
      <div className="flex items-center gap-x-2 mb-2">
        <p className="text-sm">Summary</p>
        {noAccessToData ? (
          <Badge variant="destructive">No access</Badge>
        ) : (
          <Badge variant="success">{results.length > 0 ? 'Can access' : 'Has access'}</Badge>
        )}
      </div>

      <Tabs_Shadcn_ defaultValue="policies">
        <TabsList_Shadcn_ className="gap-x-3">
          <TabsTrigger_Shadcn_ value="policies" className="px-2">
            Policies applied
          </TabsTrigger_Shadcn_>
          <TabsTrigger_Shadcn_ value="data" className="px-2">
            Data preview
          </TabsTrigger_Shadcn_>
        </TabsList_Shadcn_>

        {!!parseQueryResults && (
          <div className="border rounded-sm flex items-center justify-between px-3 py-1.5 mt-3">
            <div className="flex items-center gap-x-2">
              <p className="text-xs text-foreground-light">Ran as</p>
              {!parseQueryResults.role ? (
                <code className="text-code-inline">postgres</code>
              ) : parseQueryResults.user ? (
                <p className="text-sm truncate max-w-52">{parseQueryResults.user.email}</p>
              ) : parseQueryResults.role === 'anon' ? (
                <p className="text-xs">an Anonymous user</p>
              ) : null}
            </div>

            {parseQueryResults.role === 'anon' && (
              <p className="text-foreground-light text-xs">Not logged in user</p>
            )}
            {!!parseQueryResults.user && (
              <code className="text-code-inline">ID: {parseQueryResults.user.id}</code>
            )}
          </div>
        )}

        <TabsContent_Shadcn_ value="policies" className="mt-0">
          {!isServiceRole &&
            (!!tableWithRLSEnabledButNoPolicies ? (
              <Admonition showIcon={false} type="default" className="rounded-sm mt-2">
                <p className="mb-0.5!">This user has no access to any rows from this query</p>
                <p className="text-foreground-light">
                  The table{' '}
                  <code className="text-code-inline">
                    {tableWithRLSEnabledButNoPolicies.schema}.
                    {tableWithRLSEnabledButNoPolicies.table}
                  </code>{' '}
                  has RLS enabled but no policies set up for the{' '}
                  <code className="text-code-inline break-keep!">{parseQueryResults.role}</code>{' '}
                  role.
                </p>
              </Admonition>
            ) : tableWithRLSEnabledWithPolicyFalse ? (
              <Admonition showIcon={false} type="default" className="rounded-sm mt-2">
                <p className="mb-0.5!">This user has no access to any rows from this query</p>
                <p className="text-foreground-light">
                  The table{' '}
                  <code className="text-code-inline">
                    {tableWithRLSEnabledWithPolicyFalse.schema}.
                    {tableWithRLSEnabledWithPolicyFalse.table}
                  </code>{' '}
                  has a policy that evaluates to
                  <code className="text-code-inline break-keep!">false</code> for the{' '}
                  <code className="text-code-inline break-keep!">{parseQueryResults.role}</code>{' '}
                  role.
                </p>
              </Admonition>
            ) : null)}

          {isServiceRole && (
            <Admonition showIcon={false} type="default" className="rounded-sm mt-2">
              <p className="mb-0.5!">
                The <code className="text-code-inline">postgres</code> role has access to all rows
                for this query
              </p>
              <p className="text-foreground-light">
                The <code className="text-code-inline">postgres</code> role has admin privileges and
                bypasses all RLS policies.
              </p>
            </Admonition>
          )}

          <div className="flex flex-col gap-y-2 mt-4">
            <p className="text-sm">Table access</p>
            {!isServiceRole && (
              <div className="flex flex-col gap-y-2">
                {parseQueryResults?.tables.map((x) => {
                  const { schema, table, tablePolicies, isRLSEnabled } = x
                  return (
                    <RLSTableCard
                      key={`${schema}.${table}`}
                      table={{ schema, name: table, isRLSEnabled }}
                      role={parseQueryResults.role}
                      policies={tablePolicies}
                      handleSelectEditPolicy={handleSelectEditPolicy}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent_Shadcn_>
        <TabsContent_Shadcn_ value="data" className="mt-2">
          <div
            className={cn(
              'grow flex flex-col border overflow-hidden',
              results.length === 0 ? 'rounded-sm h-32' : 'rounded-t h-56'
            )}
          >
            <Results rows={results} />
          </div>
          {results.length > 0 && (
            <p className="border border-t-0 rounded-b font-mono text-xs text-foreground-light p-2">
              {results.length} row{results.length > 1 ? 's' : ''}
              {autoLimit && results.length >= limit && ` (Limited to only ${limit} rows)`}
            </p>
          )}
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </div>
  )
}
