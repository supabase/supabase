import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, map as lodashMap, uniqBy } from 'lodash'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconExternalLink, IconSearch, Input } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseHooksQuery } from 'data/database-triggers/database-triggers-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { noop } from 'lib/void'
import HooksListEmpty from './HooksListEmpty'
import SchemaTable from './SchemaTable'

export interface HooksListProps {
  createHook: () => void
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const HooksList = ({ createHook = noop, editHook = noop, deleteHook = noop }: HooksListProps) => {
  const { project } = useProjectContext()
  const {
    data: hooks,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useDatabaseHooksQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [filterString, setFilterString] = useState<string>('')

  const filteredHooks = (hooks || []).filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const filteredHookSchemas = lodashMap(uniqBy(filteredHooks, 'schema'), 'schema')

  const canCreateWebhooks = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')
  const isPermissionsLoaded = usePermissionsLoaded()

  return (
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
            <Tooltip.Trigger asChild>
              <Button
                disabled={!isPermissionsLoaded || !canCreateWebhooks}
                onClick={() => createHook()}
              >
                Create a new hook
              </Button>
            </Tooltip.Trigger>
            {isPermissionsLoaded && !canCreateWebhooks && (
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

      {isLoading && (
        <div className="py-4">
          <GenericSkeletonLoader />
        </div>
      )}

      {isError && <AlertError error={error} subject="Failed to retrieve database webhooks" />}

      {isSuccess &&
        (hooks.length <= 0 ? (
          <HooksListEmpty />
        ) : (
          <>
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
          </>
        ))}
    </div>
  )
}

export default HooksList
