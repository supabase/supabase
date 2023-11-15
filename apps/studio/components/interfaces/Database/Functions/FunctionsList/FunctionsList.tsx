import * as Tooltip from '@radix-ui/react-tooltip'
import { PostgresFunction } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button, IconLock, IconSearch, Input, Listbox } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions, useStore } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import FunctionList from './FunctionList'
import SchemaSelector from 'components/ui/SchemaSelector'
import ProtectedSchemaWarning from '../../ProtectedSchemaWarning'

interface FunctionsListProps {
  createFunction: () => void
  editFunction: (fn: PostgresFunction) => void
  deleteFunction: (fn: PostgresFunction) => void
}

const FunctionsList = ({
  createFunction = noop,
  editFunction = noop,
  deleteFunction = noop,
}: FunctionsListProps) => {
  const { project } = useProjectContext()
  const { meta } = useStore()
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [filterString, setFilterString] = useState<string>('')

  const canCreateFunctions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const functions = meta.functions.list()

  if (meta.functions.isLoading) {
    return <GenericSkeletonLoader />
  }

  if (meta.functions.hasError) {
    return (
      <AlertError error={meta.functions.error} subject="Failed to retrieve database functions" />
    )
  }

  return (
    <>
      {functions.length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Functions"
            ctaButtonLabel="Create a new function"
            onClickCta={() => createFunction()}
            disabled={!canCreateFunctions}
            disabledMessage="You need additional permissions to create functions"
          >
            <p className="text-sm text-foreground-light">
              PostgreSQL functions, also known as stored procedures, is a set of SQL and procedural
              commands such as declarations, assignments, loops, flow-of-control, etc.
            </p>
            <p className="text-sm text-foreground-light">
              It's stored on the database server and can be invoked using the SQL interface.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SchemaSelector
                className="w-[260px]"
                size="small"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={setSelectedSchema}
              />
              <Input
                placeholder="Search for a function"
                size="small"
                icon={<IconSearch size="tiny" />}
                value={filterString}
                className="w-64"
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>

            {!isLocked && (
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button disabled={!canCreateFunctions} onClick={() => createFunction()}>
                    Create a new function
                  </Button>
                </Tooltip.Trigger>
                {!canCreateFunctions && (
                  <Tooltip.Portal>
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
                            You need additional permissions to create functions
                          </span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            )}
          </div>

          {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="functions" />}

          <Table
            className="table-fixed"
            head={
              <>
                <Table.th key="name">Name</Table.th>
                <Table.th key="arguments" className="hidden md:table-cell">
                  Arguments
                </Table.th>
                <Table.th key="return_type" className="hidden lg:table-cell">
                  Return type
                </Table.th>
                <Table.th key="return_type" className="hidden lg:table-cell w-[100px]">
                  Security
                </Table.th>
                <Table.th key="buttons" className="w-1/6"></Table.th>
              </>
            }
            body={
              <FunctionList
                schema={selectedSchema}
                filterString={filterString}
                isLocked={isLocked}
                editFunction={editFunction}
                deleteFunction={deleteFunction}
              />
            }
          />
        </div>
      )}
    </>
  )
}

export default observer(FunctionsList)
