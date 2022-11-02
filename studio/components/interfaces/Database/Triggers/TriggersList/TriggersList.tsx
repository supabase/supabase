import { FC } from 'react'
import { includes, uniqBy, map as lodashMap } from 'lodash'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Input, IconSearch, IconLoader } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import SchemaTable from './SchemaTable'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'

const TriggersList: FC<any> = ({
  filterString,
  setFilterString = () => {},
  createTrigger = () => {},
  editTrigger = () => {},
  deleteTrigger = () => {},
}) => {
  const { meta } = useStore()
  const triggers = meta.triggers.list()
  const filteredTriggers = triggers.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const filteredTriggerSchemas = lodashMap(uniqBy(filteredTriggers, 'schema'), 'schema')
  const canCreateTriggers = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  if (meta.triggers.isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center space-x-2">
        <IconLoader className="animate-spin" size={14} />
        <p className="text-sm text-scale-1000">Loading triggers...</p>
      </div>
    )
  }

  if (meta.triggers.hasError) {
    return (
      <div className="px-6 py-4 text-scale-1000">
        <p>Error connecting to API</p>
        <p>{`${meta.triggers.error?.message ?? 'Unknown error'}`}</p>
      </div>
    )
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
        <div className="w-full space-y-4 py-4">
          <div className="flex items-center justify-between px-6">
            <Input
              placeholder="Filter by name"
              size="small"
              icon={<IconSearch size="tiny" />}
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
            />
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button disabled={!canCreateTriggers} onClick={() => createTrigger()}>
                  Create a new trigger
                </Button>
              </Tooltip.Trigger>
              {!canCreateTriggers && (
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
              )}
            </Tooltip.Root>
          </div>
          {filteredTriggers.length <= 0 && (
            <div className="mx-auto flex max-w-lg items-center justify-center space-x-3 rounded border p-6 shadow-md dark:border-dark">
              <p>No results match your filter query</p>
              <Button type="outline" onClick={() => setFilterString('')}>
                Reset filter
              </Button>
            </div>
          )}
          {filteredTriggerSchemas.map((schema: any) => (
            <SchemaTable
              key={schema}
              filterString={filterString}
              schema={schema}
              editTrigger={editTrigger}
              deleteTrigger={deleteTrigger}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default observer(TriggersList)
