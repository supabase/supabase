import Link from 'next/link'
import { useState } from 'react'
import { includes, uniqBy, map as lodashMap } from 'lodash'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Input, IconSearch, IconExternalLink } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useCheckPermissions } from 'hooks'
import SchemaTable from './SchemaTable'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseHooks } from 'data/database-triggers/database-triggers-query'
import { FormHeader } from 'components/ui/Forms'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import ClientLoadingError from 'components/ui/ClientLoadingError'
import NoSearchResults from 'components/ui/NoSearchResults'

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
            <p className="text-sm text-scale-1100">
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
                onChange={(e) => setFilterString(e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <Link href="https://supabase.com/docs/guides/database/webhooks">
                  <a target="_blank" rel="noreferrer">
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
