import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { useState } from 'react'
import { Button, Input } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { Search } from 'lucide-react'
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
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
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
          <div className="flex items-center gap-2 flex-wrap">
            <SchemaSelector
              className="w-[260px]"
              size="small"
              showError={false}
              selectedSchemaName={selectedSchema}
              onSelectSchema={setSelectedSchema}
            />
            <Input
              placeholder="Search for a trigger"
              size="small"
              icon={<Search size="14" />}
              value={filterString}
              className="w-64"
              onChange={(e) => setFilterString(e.target.value)}
            />
            {!isLocked && (
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <Button
                    className="ml-auto"
                    disabled={!canCreateTriggers}
                    onClick={() => createTrigger()}
                  >
                    Create a new trigger
                  </Button>
                </Tooltip.Trigger>
                {!canCreateTriggers && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                          'border border-background',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">
                          You need additional permissions to create triggers
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
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
