import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  type GeneratedPolicy,
  generateStartingPoliciesForTable,
} from 'components/interfaces/Auth/Policies/Policies.utils'
import { AIOptInModal } from 'components/ui/AIAssistantPanel/AIOptInModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import {
  ForeignKeyConstraint,
  useForeignKeyConstraintsQuery,
} from 'data/database/foreign-key-constraints-query'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTrack } from 'lib/telemetry/track'
import { Button, Card, CardContent, cn } from 'ui'
import type { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'
import { ColumnField } from '../../SidePanelEditor.types'

interface PolicyListEmptyStateProps {
  schema: string
  tableName?: string
  columns: ColumnField[]
  foreignKeyRelations: ForeignKey[]
  isNewRecord: boolean
  isRLSEnabled: boolean
  isDuplicating: boolean
  onGeneratedPoliciesChange?: (policies: GeneratedPolicy[]) => void
}

export const PolicyListEmptyState = ({
  schema,
  tableName,
  columns,
  foreignKeyRelations,
  isNewRecord,
  isRLSEnabled,
  isDuplicating,
  onGeneratedPoliciesChange,
}: PolicyListEmptyStateProps) => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const { includeSchemaMetadata } = useOrgAiOptInLevel()

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateFailed, setGenerateFailed] = useState(false)
  const [isOptInModalOpen, setIsOptInModalOpen] = useState(false)

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

  const emptyStateMessage = useMemo(() => {
    if (!generateFailed) {
      return {
        title: 'Generate starting policies',
        description: (
          <>
            Starter policies are generated from your table relationships to{' '}
            <code className="text-code-inline">auth.users</code> or, if none exist, using AI.
          </>
        ),
      }
    }

    if (!includeSchemaMetadata) {
      return {
        title: 'Unable to generate policies',
        description: (
          <>
            <p>We couldn't detect any relationships to auth.users to suggest policies.</p>
            <p>Enable schema metadata sharing to use our AI-assisted policy generator.</p>
          </>
        ),
      }
    }

    return {
      title: 'We could not generate policies for this table',
      description:
        "Automatic policy generation wasn't possible for this table. Update the schema and try again, or add policies manually after creating the table.",
    }
  }, [generateFailed, includeSchemaMetadata])

  const { title, description } = emptyStateMessage
  const showPermissionButton = generateFailed && !includeSchemaMetadata
  const allowPolicyGeneration = isNewRecord && !isDuplicating

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
      return toast.error(
        'Unable to generate policies. Please ensure table name and columns are set.'
      )
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

  if (allowPolicyGeneration) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div
              className={cn(
                'flex flex-col items-center gap-4 text-center',
                !generateFailed && 'max-w-sm'
              )}
            >
              <div className="flex flex-col gap-1">
                <h4 className="text-sm text-foreground">{title}</h4>
                <p className="text-sm text-foreground-lighter">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <ButtonTooltip
                  type="default"
                  size="tiny"
                  onClick={handleGeneratePolicies}
                  loading={isGenerating}
                  disabled={isGenerating || !isRLSEnabled || !tableName || columns.length === 0}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: !tableName
                        ? 'Provide a name for your table first before generating policies'
                        : columns.length === 0
                          ? 'Create at least one column first before generating policies'
                          : undefined,
                    },
                  }}
                >
                  {isGenerating
                    ? 'Generating policies...'
                    : generateFailed
                      ? 'Try generating again'
                      : 'Generate policies'}
                </ButtonTooltip>
                {showPermissionButton && (
                  <Button
                    type="default"
                    size="tiny"
                    onClick={() => setIsOptInModalOpen(true)}
                    disabled={isGenerating}
                  >
                    Permission settings
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <AIOptInModal visible={isOptInModalOpen} onCancel={() => setIsOptInModalOpen(false)} />
      </>
    )
  }

  return (
    <Card>
      <CardContent>
        <p className="text-sm text-foreground-lighter">No policies exist for this table</p>
      </CardContent>
    </Card>
  )
}
