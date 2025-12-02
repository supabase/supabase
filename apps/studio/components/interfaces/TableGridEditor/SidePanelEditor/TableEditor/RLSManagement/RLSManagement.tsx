import type { PostgresTable } from '@supabase/postgres-meta'
import { useMemo, useState } from 'react'

import { ToggleRlsButton } from 'components/ui/ToggleRlsButton'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import { Button, Card, CardContent, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import {
  generateStartingPoliciesForTable,
  type GeneratedPolicy,
} from 'components/interfaces/Auth/Policies/Policies.utils'
import { generatePolicyUpdateSQL } from 'components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import {
  useForeignKeyConstraintsQuery,
  type ForeignKeyConstraint,
} from 'data/database/foreign-key-constraints-query'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useTrack } from 'lib/telemetry/track'
import { ExternalLink, InfoIcon } from 'lucide-react'
import Link from 'next/link'
import type { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField } from '../../SidePanelEditor.types'
import { PolicyList, type PolicyListItemData } from './PolicyList'

interface RLSManagementProps {
  schema: string
  table?: PostgresTable
  tableName?: string // For new tables
  columns?: ColumnField[] // For new tables
  foreignKeyRelations?: ForeignKey[] // For new tables
  isRlsEnabled: boolean
  onChangeRlsEnabled?: (isEnabled: boolean) => void
  isNewRecord: boolean
  isDuplicating: boolean
  generatedPolicies?: GeneratedPolicy[]
  onGeneratedPoliciesChange?: (policies: GeneratedPolicy[]) => void
}

export const RLSManagement = ({
  schema,
  table,
  tableName,
  columns = [],
  foreignKeyRelations = [],
  isRlsEnabled,
  onChangeRlsEnabled,
  isNewRecord,
  isDuplicating,
  generatedPolicies = [],
  onGeneratedPoliciesChange,
}: RLSManagementProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateFailed, setGenerateFailed] = useState(false)
  const { includeSchemaMetadata } = useOrgAiOptInLevel()
  const track = useTrack()
  const isExistingTable = !!table && !isNewRecord && !isDuplicating
  const rlsEnabled = isRlsEnabled ?? false

  const { data: policies } = useDatabasePoliciesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: !isNewRecord && !isDuplicating,
    }
  )

  // Fetch foreign key constraints for policy generation BFS traversal
  const { data: schemaForeignKeys } = useForeignKeyConstraintsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: schema,
    },
    {
      enabled: isNewRecord && !isDuplicating && !!schema,
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

  const convertForeignKeysToConstraints = (fks: ForeignKey[]): ForeignKeyConstraint[] => {
    if (!tableName || !schema) {
      return []
    }

    return fks
      .filter((fk) => fk.columns && fk.columns.length > 0) // Only include FKs with columns
      .map((fk) => ({
        id: typeof fk.id === 'number' ? fk.id : 0,
        constraint_name: fk.name || '',
        source_id: typeof fk.tableId === 'number' ? fk.tableId : 0,
        source_schema: schema.trim(),
        source_table: tableName.trim(),
        source_columns: fk.columns.map((col: { source: string; target: string }) =>
          col.source.trim()
        ),
        target_id: 0,
        target_schema: fk.schema.trim(),
        target_table: fk.table.trim(),
        target_columns: fk.columns.map((col: { source: string; target: string }) =>
          col.target.trim()
        ),
        deletion_action: fk.deletionAction || 'NO ACTION',
        update_action: fk.updateAction || 'NO ACTION',
      }))
  }

  const handleGeneratePolicies = async () => {
    if (!project?.ref || !tableName || columns.length === 0) {
      toast.error('Unable to generate policies. Please ensure table name and columns are set.')
      return
    }

    track('rls_generate_policies_clicked')

    setIsGenerating(true)
    try {
      const trimmedTableName = tableName.trim()
      const trimmedSchema = schema.trim()

      const newTableForeignKeys = convertForeignKeysToConstraints(foreignKeyRelations)

      const allForeignKeys = [
        ...newTableForeignKeys,
        ...(schemaForeignKeys ?? []).filter(
          (existingFk) =>
            !(
              existingFk.source_schema === trimmedSchema &&
              existingFk.source_table === trimmedTableName
            )
        ),
      ]

      const tableColumns = columns.map((col) => ({ name: col.name.trim() }))

      const policies = await generateStartingPoliciesForTable({
        table: { name: trimmedTableName, schema: trimmedSchema },
        foreignKeyConstraints: allForeignKeys,
        columns: tableColumns,
        projectRef: project.ref,
        connectionString: project.connectionString,
        enableAi: includeSchemaMetadata,
      })

      if (policies.length === 0) {
        setGenerateFailed(true)
      } else {
        setGenerateFailed(false)
        onGeneratedPoliciesChange?.(policies)
      }
    } catch (error: any) {
      console.error('Failed to generate policies:', error)
      toast.error(error.message || 'Failed to generate policies')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRlsToggleSuccess = (nextIsEnabled: boolean) => {
    onChangeRlsEnabled?.(nextIsEnabled)
    toast.success(
      nextIsEnabled
        ? 'Row Level Security has been enabled for this table.'
        : 'Row Level Security has been disabled for this table.'
    )
  }

  const handleRlsToggleError = (error: ResponseError) => {
    toast.error(error.message ?? 'Unable to update Row Level Security for this table.')
  }

  const renderEnableRlsButton = () => {
    if (!project || !table || !isExistingTable) return null
    return (
      <ToggleRlsButton
        tableId={table.id}
        type="default"
        size="tiny"
        schema={table.schema ?? schema}
        tableName={table.name}
        isRlsEnabled={rlsEnabled}
        projectRef={project.ref}
        connectionString={project.connectionString ?? null}
        onSuccess={handleRlsToggleSuccess}
        onError={handleRlsToggleError}
        className="w-fit mt-4"
      />
    )
  }

  const disablePoliciesList = isExistingTable && !rlsEnabled

  const renderPolicies = () => {
    if (!hasPolicies) {
      if (isNewRecord && !isDuplicating) {
        return (
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="flex flex-col gap-1">
                <h4 className="text-sm text-foreground">
                  {generateFailed
                    ? 'We could not generate policies for this table'
                    : 'Generate starting policies'}
                </h4>
                <p className="text-sm text-foreground-lighter">
                  {generateFailed
                    ? 'Update your table schema and try again or add policies manually after the table is created.'
                    : 'Policies will be generated based on your table schema and relationships and can be customized after the table is created.'}
                </p>
              </div>
              <Button
                type="default"
                size="tiny"
                onClick={handleGeneratePolicies}
                loading={isGenerating}
                disabled={isGenerating || !isRlsEnabled}
              >
                {isGenerating
                  ? 'Generating policies...'
                  : generateFailed
                    ? 'Try generating again'
                    : 'Generate policies'}
              </Button>
            </div>
          </CardContent>
        )
      }
      return (
        <CardContent>
          <p className="text-sm text-foreground-lighter">No policies exist for this table</p>
        </CardContent>
      )
    }

    const handleRemoveGeneratedPolicy = (index: number) => {
      // Find the index in generatedPoliciesList that corresponds to the allPoliciesList index
      const generatedIndex = index - existingPoliciesList.length
      if (generatedIndex >= 0 && generatedIndex < generatedPolicies.length) {
        const updatedPolicies = generatedPolicies.filter((_, i) => i !== generatedIndex)
        onGeneratedPoliciesChange?.(updatedPolicies)

        // Track policy removal
        if (project?.ref) {
          track('rls_generated_policy_removed')
        }
      }
    }

    return (
      <PolicyList
        policies={allPoliciesList}
        className="border-0 rounded-none"
        onRemove={isNewRecord && !isDuplicating ? handleRemoveGeneratedPolicy : undefined}
      />
    )
  }

  if (!project) return null

  if (isNewRecord && !isDuplicating) {
    return (
      <div>
        <div className="flex items-center mb-4 gap-2">
          <div className="flex-1">
            <h3>Policies</h3>
            <p className="text-sm text-foreground-lighter">
              Set rules around who can read and write data to this table
            </p>
          </div>
        </div>

        <Card>{renderPolicies()}</Card>
        {generatedPolicies?.length > 0 && (
          <p className="text-xs text-foreground-lighter mt-4 flex items-center gap-2">
            <InfoIcon size={16} strokeWidth={1.5} />
            Review the policies generated before creating your table
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center mb-4 gap-2">
        <div className="flex-1">
          <h3>Policies</h3>
          <p className="text-sm text-foreground-lighter">
            Set rules around who can read and write data to this table
          </p>
        </div>
        <Button
          asChild
          type="default"
          size="tiny"
          icon={<ExternalLink size={16} strokeWidth={1.5} />}
        >
          <Link href={`/project/${project.ref}/auth/policies`} target="_blank">
            Manage policies
          </Link>
        </Button>
      </div>

      {isExistingTable && !rlsEnabled && (
        <Admonition
          className="mb-4"
          type="warning"
          title="Row Level Security is disabled"
          description="Your table is currently accessible by anyone on the internet. We recommend enabling RLS to restrict access."
          actions={renderEnableRlsButton()}
        />
      )}

      <Card
        aria-disabled={disablePoliciesList}
        className={cn(disablePoliciesList && 'opacity-50 pointer-events-none')}
      >
        {renderPolicies()}
      </Card>
    </div>
  )
}
