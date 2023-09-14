import * as Tooltip from '@radix-ui/react-tooltip'
import { PostgresSchema } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button, IconLock, IconSearch, Input, Listbox } from 'ui'

import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, useStore } from 'hooks'
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
  const { meta } = useStore()
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [filterString, setFilterString] = useState<string>('')

  const schemas: PostgresSchema[] = meta.schemas.list()
  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  const schema = schemas.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const triggers = meta.triggers.list()
  const canCreateTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  if (meta.triggers.isLoading) {
    return <GenericSkeletonLoader />
  }

  if (meta.triggers.hasError) {
    return <AlertError error={meta.triggers.error} subject="Failed to retrieve database triggers" />
  }

  return (
    <>
      {triggers.length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Triggers"
            ctaButtonLabel="Create a new trigger"
            onClickCta={() => createTrigger()}
          >
            <AlphaPreview />
            <p className="text-sm text-scale-1100">
              A PostgreSQL trigger is a function invoked automatically whenever an event associated
              with a table occurs.
            </p>
            <p className="text-sm text-scale-1100">
              An event could be any of the following: INSERT, UPDATE, DELETE. A trigger is a special
              user-defined function associated with a table.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-[260px]">
                <Listbox
                  size="small"
                  value={selectedSchema}
                  onChange={setSelectedSchema}
                  icon={isLocked && <IconLock size={14} strokeWidth={2} />}
                >
                  <Listbox.Option
                    disabled
                    key="normal-schemas"
                    value="normal-schemas"
                    label="Schemas"
                  >
                    <p className="text-sm">Schemas</p>
                  </Listbox.Option>
                  {/* @ts-ignore */}
                  {openSchemas.map((schema) => (
                    <Listbox.Option
                      key={schema.id}
                      value={schema.name}
                      label={schema.name}
                      addOnBefore={() => <span className="text-scale-900">schema</span>}
                    >
                      <span className="text-scale-1200 text-sm">{schema.name}</span>
                    </Listbox.Option>
                  ))}
                  <Listbox.Option
                    disabled
                    key="protected-schemas"
                    value="protected-schemas"
                    label="Protected schemas"
                  >
                    <p className="text-sm">Protected schemas</p>
                  </Listbox.Option>
                  {protectedSchemas.map((schema) => (
                    <Listbox.Option
                      key={schema.id}
                      value={schema.name}
                      label={schema.name}
                      addOnBefore={() => <span className="text-scale-900">schema</span>}
                    >
                      <span className="text-scale-1200 text-sm">{schema.name}</span>
                    </Listbox.Option>
                  ))}
                </Listbox>
              </div>
              <Input
                placeholder="Filter by name"
                size="small"
                icon={<IconSearch size="tiny" />}
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>

            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button disabled={!canCreateTriggers} onClick={() => createTrigger()}>
                  Create a new trigger
                </Button>
              </Tooltip.Trigger>
              {!canCreateTriggers && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">
                        You need additional permissions to create triggers
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>

          <Table
            className="table-fixed"
            head={
              <>
                <Table.th key="name" className="space-x-4">
                  Name
                </Table.th>
                <Table.th key="table" className="hidden lg:table-cell">
                  Table
                </Table.th>
                <Table.th key="function" className="hidden xl:table-cell">
                  Function
                </Table.th>
                <Table.th key="events" className="hidden xl:table-cell">
                  Events
                </Table.th>
                <Table.th key="enabled" className="hidden w-20 xl:table-cell">
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

export default observer(TriggersList)
