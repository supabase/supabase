import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, map as lodashMap, uniqBy } from 'lodash'
import { Search } from 'lucide-react'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import NoSearchResults from 'components/ui/NoSearchResults'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseHooksQuery } from 'data/database-triggers/database-triggers-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { noop } from 'lib/void'
import { Input } from 'ui'
import { HooksListEmpty } from './HooksListEmpty'
import { SchemaTable } from './SchemaTable'

export interface HooksListProps {
  createHook: () => void
  editHook: (hook: PostgresTrigger) => void
  deleteHook: (hook: PostgresTrigger) => void
}

export const HooksList = ({
  createHook = noop,
  editHook = noop,
  deleteHook = noop,
}: HooksListProps) => {
  const { data: project } = useSelectedProjectQuery()
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

  const { can: canCreateWebhooks, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search for a webhook"
          size="tiny"
          icon={<Search size="14" />}
          value={filterString}
          className="w-52"
          onChange={(e) => setFilterString(e.target.value)}
        />
        <div className="flex items-center gap-x-2">
          <DocsButton href={`${DOCS_URL}/guides/database/webhooks`} />
          <ButtonTooltip
            onClick={() => createHook()}
            disabled={!isPermissionsLoaded || !canCreateWebhooks}
            tooltip={{
              content: {
                side: 'bottom',
                text:
                  isPermissionsLoaded && !canCreateWebhooks
                    ? 'You need additional permissions to create webhooks'
                    : undefined,
              },
            }}
          >
            Create a new hook
          </ButtonTooltip>
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
