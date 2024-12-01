import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { Search } from 'lucide-react'
import { useState } from 'react'

import { useIsAssistantV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation, Input } from 'ui'
import ProtectedSchemaWarning from '../../ProtectedSchemaWarning'
import TriggerList from './TriggerList'

interface TriggersListProps {
  createTrigger: () => void
  editTrigger: (trigger: any) => void
  deleteTrigger: (trigger: any) => void
}

const TriggersList = ({
  createTrigger = noop,
  editTrigger = noop,
  deleteTrigger = noop,
}: TriggersListProps) => {
  const { project } = useProjectContext()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [filterString, setFilterString] = useState<string>('')

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    PROTECTED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const {
    data: triggers,
    error,
    isLoading,
    isError,
  } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const canCreateTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  const { setAiAssistantPanel } = useAppStateSnapshot()
  const isAssistantV2Enabled = useIsAssistantV2Enabled()

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve database triggers" />
  }

  return (
    <>
      {(triggers ?? []).length === 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Triggers"
            ctaButtonLabel="Create a new trigger"
            onClickCta={() => createTrigger()}
          >
            <AlphaPreview />
            <p className="text-sm text-foreground-light">
              A PostgreSQL trigger is a function invoked automatically whenever an event associated
              with a table occurs.
            </p>
            <p className="text-sm text-foreground-light">
              An event could be any of the following: INSERT, UPDATE, DELETE. A trigger is a special
              user-defined function associated with a table.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-x-2">
              <SchemaSelector
                className="w-[180px]"
                size="tiny"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={setSelectedSchema}
              />
              <Input
                placeholder="Search for a trigger"
                size="tiny"
                icon={<Search size="14" />}
                value={filterString}
                className="w-52"
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>
            {!isLocked && (
              <div className="flex items-center gap-x-2">
                <ButtonTooltip
                  disabled={!canCreateTriggers}
                  onClick={() => createTrigger()}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: !canCreateTriggers
                        ? 'You need additional permissions to create triggers'
                        : undefined,
                    },
                  }}
                >
                  Create a new trigger
                </ButtonTooltip>
                {isAssistantV2Enabled && (
                  <ButtonTooltip
                    type="default"
                    disabled={!canCreateTriggers}
                    className="px-1 pointer-events-auto"
                    icon={<AiIconAnimation size={16} />}
                    onClick={() =>
                      setAiAssistantPanel({
                        open: true,
                        initialInput: `Create a new trigger for the schema ${selectedSchema} that does ...`,
                        suggestions: {
                          title:
                            'I can help you create a new trigger, here are a few example prompts to get you started:',
                          prompts: [
                            'Create a trigger that logs changes to the users table',
                            'Create a trigger that updates updated_at timestamp',
                            'Create a trigger that validates email format before insert',
                          ],
                        },
                      })
                    }
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateTriggers
                          ? 'You need additional permissions to create triggers'
                          : 'Create with Supabase Assistant',
                      },
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="triggers" />}

          <Table
            head={
              <>
                <Table.th key="name">Name</Table.th>
                <Table.th key="table">Table</Table.th>
                <Table.th key="function">Function</Table.th>
                <Table.th key="events">Events</Table.th>
                <Table.th key="orientation">Orientation</Table.th>
                <Table.th key="enabled" className="w-20">
                  Enabled
                </Table.th>
                <Table.th key="buttons" className="w-1/12"></Table.th>
              </>
            }
            body={
              <TriggerList
                schema={selectedSchema}
                filterString={filterString}
                isLocked={isLocked}
                editTrigger={editTrigger}
                deleteTrigger={deleteTrigger}
              />
            }
          />
        </div>
      )}
    </>
  )
}

export default TriggersList
