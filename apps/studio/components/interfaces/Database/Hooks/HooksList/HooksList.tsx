import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, map as lodashMap, uniqBy } from 'lodash'
import { Search } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useRef, useState } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { HooksListEmpty } from './HooksListEmpty'
import { SchemaTable } from './SchemaTable'
import AlertError from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoSearchResults } from '@/components/ui/NoSearchResults'
import { useDatabaseHooksQuery } from '@/data/database-triggers/database-triggers-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import { onSearchInputEscape } from '@/lib/keyboard'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const HooksList = () => {
  const { data: project } = useSelectedProjectQuery()

  const [, setShowCreateHookForm] = useQueryState('new', parseAsBoolean.withDefault(false))

  const {
    data: hooks = [],
    isPending: isLoading,
    isSuccess,
    isError,
    error,
  } = useDatabaseHooksQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [filterString, setFilterString] = useState<string>('')

  const filteredHooks = hooks.filter((x) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const filteredHookSchemas = lodashMap(uniqBy(filteredHooks, 'schema'), 'schema')

  const { can: canCreateWebhooks, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  const searchInputRef = useRef<HTMLInputElement>(null)

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search webhooks' }
  )
  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, () => setFilterString(''))
  useShortcut(SHORTCUT_IDS.LIST_PAGE_NEW_ITEM, () => setShowCreateHookForm(true), {
    label: 'Create webhook',
    enabled: isPermissionsLoaded && canCreateWebhooks,
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <InputGroup className="w-52">
          <InputGroupInput
            ref={searchInputRef}
            size="tiny"
            placeholder="Search for a webhook"
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            onKeyDown={onSearchInputEscape(filterString, setFilterString)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex items-center gap-x-2">
          <DocsButton href={`${DOCS_URL}/guides/database/webhooks`} />
          <ButtonTooltip
            onClick={() => setShowCreateHookForm(true)}
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
            {filteredHookSchemas.map((schema) => (
              <SchemaTable key={schema} filterString={filterString} schema={schema} />
            ))}
          </>
        ))}
    </div>
  )
}
