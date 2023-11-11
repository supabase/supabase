import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, map as lodashMap, uniqBy } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconExternalLink, IconSearch, Input } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms'
import NoSearchResults from 'components/ui/NoSearchResults'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseHooks } from 'data/database-triggers/database-triggers-query'
import { useCheckPermissions } from 'hooks'
import SchemaTable from './SchemaTable'

export interface HooksListProps {
  createHook: () => void
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const HooksList = ({
  createHook = () => {},
  editHook = () => {},
  deleteHook = () => {},
}: HooksListProps) => {
  const { project } = useProjectContext()
  const {
    error,
    data: hooks,
    isLoading,
    isError,
  } = useDatabaseHooks({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [filterString, setFilterString] = useState<string>('')

  const filteredHooks = (hooks || []).filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const filteredHookSchemas = lodashMap(uniqBy(filteredHooks, 'schema'), 'schema')
  const canCreateWebhooks = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  return (
    <>
      {isLoading ? (
        <div className="py-4">
          <GenericSkeletonLoader />
        </div>
      ) : isError ? (
        <AlertError error={error} subject="Failed to retrieve database webhooks" />
      ) : (hooks || []).length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Database Webhooks"
            ctaButtonLabel="Create Webhook"
            onClickCta={() => createHook()}
            disabled={!canCreateWebhooks}
            disabledMessage="You need additional permissions to create webhooks"
          >
            <p className="text-sm text-foreground-light">
              Database Webhooks can be used to trigger serverless functions or send requests to an
              HTTP endpoint.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <FormHeader
              title="Database Webhooks"
              description="Send real-time data from your database to another system whenever a table event occurs"
            />
          </div>
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Search for a webhook"
                size="small"
                icon={<IconSearch size="tiny" />}
                value={filterString}
                className="w-64"
                onChange={(e) => setFilterString(e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  <Link
                    href="https://supabase.com/docs/guides/database/webhooks"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Documentation
                  </Link>
                </Button>
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger>
                    <Button disabled={!canCreateWebhooks} onClick={() => createHook()}>
                      Create a new hook
                    </Button>
                  </Tooltip.Trigger>
                  {!canCreateWebhooks && (
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
                            You need additional permissions to create webhooks
                          </span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  )}
                </Tooltip.Root>
              </div>
            </div>
            {filteredHooks.length <= 0 && (
              <NoSearchResults
                searchString={filterString}
                onResetFilter={() => setFilterString('')}
              />
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
        </>
      )}
    </>
  )
}

export default observer(HooksList)
