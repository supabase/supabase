import { FC } from 'react'
import { includes, uniqBy, map as lodashMap } from 'lodash'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Input, IconSearch, IconLoader } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions } from 'hooks'
import SchemaTable from './SchemaTable'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'

function isHooksEnabled(schemas: any): boolean {
  return schemas.some((schema: any) => schema.name === 'supabase_functions')
}

const HooksList: FC<any> = ({
  hooksEnabled,
  filterString,
  setFilterString = () => {},
  createHook = () => {},
  editHook = () => {},
  deleteHook = () => {},
  enableHooks = () => {},
}) => {
  const { meta } = useStore()
  const hooks = meta.hooks.list()
  const schemas = meta.schemas.list()
  const filteredHooks = hooks.filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const filteredHookSchemas = lodashMap(uniqBy(filteredHooks, 'schema'), 'schema')
  const canCreateWebhooks = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  const isEnabled = hooksEnabled || isHooksEnabled(schemas)

  if (!isEnabled) {
    return (
      <>
        {schemas.length === 0 ? (
          <span className="px-6 py-4 text-scale-1100">Checking if hooks are enabled...</span>
        ) : (
          <ProductEmptyState
            title="Hooks"
            ctaButtonLabel="Enable Hooks"
            onClickCta={() => enableHooks()}
            disabled={!canCreateWebhooks}
            disabledMessage="You need additional permissions to enable hooks"
          >
            <AlphaPreview />
            <p className="text-sm text-scale-1100">Enable hooks on your project.</p>
          </ProductEmptyState>
        )}
      </>
    )
  }

  if (meta.hooks.isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center space-x-2">
        <IconLoader className="animate-spin" size={14} />
        <p>Loading hooks...</p>
      </div>
    )
  }

  if (meta.hooks.hasError) {
    return (
      <p className="px-6 py-4">
        <p>Error connecting to API</p>
        <p>{`${meta.hooks.error?.message ?? 'Unknown error'}`}</p>
      </p>
    )
  }

  return (
    <>
      {hooks.length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Database Webhooks"
            ctaButtonLabel="Create Webhook"
            onClickCta={() => createHook()}
            disabled={!canCreateWebhooks}
            disabledMessage="You need additional permissions to create webhooks"
          >
            <AlphaPreview />
            <p className="text-sm text-scale-1100">
              Database Webhooks can be used to trigger serverless functions or send requests to an
              HTTP endpoint.
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
                <Button disabled={!canCreateWebhooks} onClick={() => createHook()}>
                  Create a new hook
                </Button>
              </Tooltip.Trigger>
              {!canCreateWebhooks && (
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
                      You need additional permissions to create webhooks
                    </span>
                  </div>
                </Tooltip.Content>
              )}
            </Tooltip.Root>
          </div>
          {filteredHooks.length <= 0 && (
            <div className="mx-auto flex max-w-lg items-center justify-center space-x-3 rounded border p-6 shadow-md dark:border-dark">
              <p>No results match your filter query</p>
              <Button type="outline" onClick={() => setFilterString('')}>
                Reset filter
              </Button>
            </div>
          )}
          {filteredHookSchemas.map((schema: any) => (
            <SchemaTable
              key={schema}
              filterString={filterString}
              schema={schema}
              editHook={editHook}
              deleteHook={deleteHook}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default observer(HooksList)
