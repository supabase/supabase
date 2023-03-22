import { FC } from 'react'
import Link from 'next/link'
import { includes, uniqBy, map as lodashMap } from 'lodash'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Input, IconSearch, IconLoader, IconExternalLink } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions } from 'hooks'
import SchemaTable from './SchemaTable'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseHooks } from 'data/database-triggers/database-triggers-query'
import { FormHeader } from 'components/ui/Forms'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import ClientLoadingError from 'components/ui/ClientLoadingError'

// [Joshen] Can we somehow merge the hooksEnabled check from the index.tsx page file and this?

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
  const schemas = meta.schemas.list()

  const { project } = useProjectContext()
  const {
    data: hooks,
    isLoading,
    isError,
  } = useDatabaseHooks({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const filteredHooks = (hooks || []).filter((x: any) =>
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

  return (
    <>
      <div className="flex items-center justify-between">
        <FormHeader
          title="Database Webhooks"
          description="Send real-time data from your database to another system whenever a table event occurs"
        />
      </div>
      {isLoading ? (
        <div className="py-4 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : isError ? (
        <ClientLoadingError
          projectRef={project?.ref ?? ''}
          description="Failed to retrieve database webhooks"
        />
      ) : (hooks || []).length == 0 ? (
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
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search for a webhook"
              size="small"
              icon={<IconSearch size="tiny" />}
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Link href="https://supabase.com/docs/guides/database/webhooks">
                <a target="_blank">
                  <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                    Documentation
                  </Button>
                </a>
              </Link>
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
          </div>
          {filteredHooks.length <= 0 && (
            <div className="mx-auto flex max-w-lg items-center justify-center space-x-3 rounded border py-6 shadow-md dark:border-dark">
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
