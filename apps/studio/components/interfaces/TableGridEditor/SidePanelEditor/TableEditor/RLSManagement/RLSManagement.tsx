import type { PostgresTable } from '@supabase/postgres-meta'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { type GeneratedPolicy } from 'components/interfaces/Auth/Policies/Policies.utils'
import { generatePolicyUpdateSQL } from 'components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import type { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'
import { TableField } from '../TableEditor.types'
import { PolicyList, type PolicyListItemData } from './PolicyList'
import { PolicyListEmptyState } from './PolicyListEmptyState'
import { ToggleRLSButton } from './ToggleRLSButton'

interface RLSManagementProps {
  table?: PostgresTable
  tableFields: TableField // Fields within the form
  foreignKeyRelations?: ForeignKey[] // For new tables
  isNewRecord: boolean
  isDuplicating: boolean
  generatedPolicies?: GeneratedPolicy[]
  onRLSUpdate?: (isEnabled: boolean) => void
  onGeneratedPoliciesChange?: (policies: GeneratedPolicy[]) => void
}

export const RLSManagement = ({
  table,
  tableFields,
  foreignKeyRelations = [],
  isNewRecord,
  isDuplicating,
  generatedPolicies = [],
  onRLSUpdate,
  onGeneratedPoliciesChange,
}: RLSManagementProps) => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema } = useQuerySchemaState()

  const { name: tableName, columns, isRLSEnabled } = tableFields
  const schema = table?.schema ?? selectedSchema

  const isExistingTable = !!table && !isNewRecord && !isDuplicating
  const generatedPoliciesTargetTable = generatedPolicies[0]?.table
  const policiesNotRelevantDueToTableNameChange =
    isNewRecord && tableName !== generatedPoliciesTargetTable
  const disablePoliciesList =
    (isExistingTable && !isRLSEnabled) || policiesNotRelevantDueToTableNameChange

  const { data: policies } = useDatabasePoliciesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: !isNewRecord && !isDuplicating,
    }
  )

  const tablePolicies = (policies ?? []).filter(
    (policy) => policy.schema === table?.schema && policy.table === table?.name
  )

  const existingPoliciesList = useMemo<PolicyListItemData[]>(
    () =>
      (tablePolicies ?? []).map((policy) => ({
        name: policy.name,
        command: policy.action ?? policy.command,
        sql: generatePolicyUpdateSQL(policy),
        isNew: false,
      })),
    [tablePolicies]
  )

  // Convert generated policies to PolicyListItemData format
  const generatedPoliciesList = useMemo<PolicyListItemData[]>(
    () =>
      generatedPolicies.map((policy) => ({
        name: policy.name,
        command: policy.command,
        sql: policy.sql,
        isNew: true,
      })),
    [generatedPolicies]
  )

  const allPoliciesList = useMemo<PolicyListItemData[]>(
    () => [...existingPoliciesList, ...generatedPoliciesList],
    [existingPoliciesList, generatedPoliciesList]
  )

  const hasPolicies = allPoliciesList.length > 0

  const handleRemoveGeneratedPolicy = (index: number) => {
    // Find the index in generatedPoliciesList that corresponds to the allPoliciesList index
    const generatedIndex = index - existingPoliciesList.length
    if (generatedIndex >= 0 && generatedIndex < generatedPolicies.length) {
      const updatedPolicies = generatedPolicies.filter((_, i) => i !== generatedIndex)
      onGeneratedPoliciesChange?.(updatedPolicies)

      // Track policy removal
      if (project?.ref) track('rls_generated_policy_removed')
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h5>Policies</h5>
          <p className="text-sm text-foreground-lighter">
            Set rules around who can read and write data to this table
          </p>
        </div>
        {!isNewRecord && (
          <Button asChild type="default" icon={<ExternalLink />}>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`/project/${project?.ref}/auth/policies`}
            >
              Manage policies
            </Link>
          </Button>
        )}
      </div>

      {generatedPolicies.length > 0 && policiesNotRelevantDueToTableNameChange && (
        <Admonition
          type="warning"
          title="Update generated policies with new table name"
          description={`These policies were previously generated for the table name "${generatedPoliciesTargetTable}"`}
          actions={
            <Button
              type="default"
              className="w-min mt-3"
              onClick={() => {
                const updatedPolicies = generatedPolicies.map((policy) => {
                  return {
                    ...policy,
                    table: tableName,
                    name: policy.name.replaceAll(generatedPoliciesTargetTable, tableName),
                    sql: policy.sql.replaceAll(generatedPoliciesTargetTable, tableName),
                  }
                })
                onGeneratedPoliciesChange?.(updatedPolicies)
              }}
            >
              Update policies
            </Button>
          }
        />
      )}

      <Admonition
        // [Joshen] Using CSS to determine visibility here as the onSuccess within ToggleRLSButton doesn't get triggered
        // if we dynamically render this component, since this admonition gets unmounted from the DOM once RLS is updated
        className={cn('mb-0', !isNewRecord && !isRLSEnabled ? 'block' : 'hidden')}
        type="warning"
        title="Row Level Security is currently disabled"
        description="Your table is currently accessible by anyone on the internet. We recommend enabling RLS to restrict access."
        actions={
          <div className="flex items-center gap-x-2 mt-3">
            <ToggleRLSButton table={table} isRLSEnabled={isRLSEnabled} onSuccess={onRLSUpdate} />
            <DocsButton href={`${DOCS_URL}/guides/database/postgres/row-level-security`} />
          </div>
        }
      />

      {!hasPolicies ? (
        <PolicyListEmptyState
          schema={schema}
          tableName={tableName}
          columns={columns}
          foreignKeyRelations={foreignKeyRelations}
          isNewRecord={isNewRecord}
          isDuplicating={isDuplicating}
          isRLSEnabled={isRLSEnabled}
          onGeneratedPoliciesChange={(policies) => {
            onGeneratedPoliciesChange?.(policies)
          }}
        />
      ) : (
        <PolicyList
          policies={allPoliciesList}
          disabled={disablePoliciesList}
          className="border-0 rounded-none"
          onRemove={isNewRecord && !isDuplicating ? handleRemoveGeneratedPolicy : undefined}
        />
      )}
    </div>
  )
}
