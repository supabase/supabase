import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { DatabaseZap, FunctionSquare, Plus, Search, Shield } from 'lucide-react'
import { useState } from 'react'

import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema, useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  cn,
  Input,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { ProtectedSchemaWarning } from '../../ProtectedSchemaWarning'
import TriggerList from './TriggerList'
import Link from 'next/link'

interface TriggersListProps {
  createTrigger: () => void
  editTrigger: (trigger: PostgresTrigger) => void
  deleteTrigger: (trigger: PostgresTrigger) => void
}

const TriggersList = ({
  createTrigger = noop,
  editTrigger = noop,
  deleteTrigger = noop,
}: TriggersListProps) => {
  const { data: project } = useSelectedProjectQuery()
  const aiSnap = useAiAssistantStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [filterString, setFilterString] = useState<string>('')

  const { data: protectedSchemas } = useProtectedSchemas()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const { data = [] } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const hasTables =
    data.filter((a) => !protectedSchemas.find((s) => s.name === a.schema)).length > 0

  const {
    data: triggers,
    error,
    isLoading,
    isError,
  } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { can: canCreateTriggers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve database triggers" />
  }

  const schemaTriggers = triggers.filter((x) => x.schema == selectedSchema)

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <SchemaSelector
            className="w-full lg:w-[180px]"
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
            className="w-full lg:w-52"
            onChange={(e) => setFilterString(e.target.value)}
          />
        </div>
        {!isSchemaLocked && (
          <div className="flex items-center gap-x-2">
            <ButtonTooltip
              disabled={!hasTables || !canCreateTriggers}
              icon={<Plus />}
              onClick={() => createTrigger()}
              className="flex-grow"
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !hasTables
                    ? 'Create a table first before creating triggers'
                    : !canCreateTriggers
                      ? 'You need additional permissions to create triggers'
                      : undefined,
                },
              }}
            >
              New trigger
            </ButtonTooltip>

            {hasTables && (
              <ButtonTooltip
                type="default"
                disabled={!hasTables || !canCreateTriggers}
                className="px-1 pointer-events-auto"
                icon={<AiIconAnimation size={16} />}
                onClick={() =>
                  aiSnap.newChat({
                    name: 'Create new trigger',
                    open: true,
                    initialInput: `Create a new trigger for the schema ${selectedSchema} that does ...`,
                    suggestions: {
                      title:
                        'I can help you create a new trigger, here are a few example prompts to get you started:',
                      prompts: [
                        {
                          label: 'Log Changes',
                          description: 'Create a trigger that logs changes to the users table',
                        },
                        {
                          label: 'Update Timestamp',
                          description: 'Create a trigger that updates updated_at timestamp',
                        },
                        {
                          label: 'Validate Email',
                          description: 'Create a trigger that validates email format before insert',
                        },
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

      {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="triggers" />}

      {!isSchemaLocked && (schemaTriggers ?? []).length === 0 ? (
        <Card className="grid grid-cols-1 @xl:grid-cols-3 bg divide-x @container">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <DatabaseZap strokeWidth={1.5} size={16} className="text-foreground-light" />
              <h3 className="heading-default">Create realtime experiences</h3>
            </div>
            <p className="text-foreground-light text-sm flex-1">
              Keep your application in sync by automatically updating when data changes
            </p>
          </div>

          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <FunctionSquare strokeWidth={1.5} size={16} className="text-foreground-light" />
              <h3 className="heading-default">Trigger an edge function</h3>
            </div>
            <p className="text-foreground-light text-sm flex-1">
              Automatically invoke edge functions when database events occur
            </p>
          </div>

          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield strokeWidth={1.5} size={16} className="text-foreground-light" />
              <h3 className="heading-default">Validate data</h3>
            </div>
            <p className="text-foreground-light text-sm flex-1">
              Ensure data meets your requirements before it is inserted into the database
            </p>
          </div>
        </Card>
      ) : (
        <div className="w-full overflow-hidden overflow-x-auto">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="name">Name</TableHead>
                  <TableHead key="table">Table</TableHead>
                  <TableHead key="function">Function</TableHead>
                  <TableHead key="events">Events</TableHead>
                  <TableHead key="orientation">Orientation</TableHead>
                  <TableHead key="enabled" className="w-20">
                    Enabled
                  </TableHead>
                  <TableHead key="buttons" className="w-1/12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TriggerList
                  schema={selectedSchema}
                  filterString={filterString}
                  isLocked={isSchemaLocked}
                  editTrigger={editTrigger}
                  deleteTrigger={deleteTrigger}
                />
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}

export default TriggersList
