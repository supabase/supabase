import { useQuery } from '@tanstack/react-query'
import { includes, map as lodashMap, uniqBy } from 'lodash'
import { SearchIcon } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useRef, useState } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { HooksListEmpty } from './HooksListEmpty'
import { SchemaTable } from './SchemaTable'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { NoSearchResults } from '@/components/ui/NoSearchResults'
import { databaseHooksQueryOptions } from '@/data/database-triggers/database-triggers-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import { getWriteGrantTooltip, useGrant } from '@/lib/grants'
import { onSearchInputEscape } from '@/lib/keyboard'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const HooksList = () => {
  const { data: project } = useSelectedProjectQuery()

  const [, setShowCreateHookForm] = useQueryState('new', parseAsBoolean.withDefault(false))

  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: project?.ref },
    { variant: 'read' }
  )
  const writeGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: project?.ref },
    { variant: 'write' }
  )
  const {
    data: hooks = [],
    isPending: isLoadingHooks,
    isSuccess,
    isError,
    error,
  } = useQuery(
    databaseHooksQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      grant: readGrant.grant,
    })
  )
  const isLoading =
    readGrant.status === 'loading' || (readGrant.status === 'granted' && isLoadingHooks)
  const [filterString, setFilterString] = useState<string>('')

  const filteredHooks = hooks.filter((x) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const filteredHookSchemas = lodashMap(uniqBy(filteredHooks, 'schema'), 'schema')

  const canCreateWebhooks = writeGrant.status === 'granted'

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
    enabled: canCreateWebhooks,
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
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex items-center gap-x-2">
          <DocsButton href={`${DOCS_URL}/guides/database/webhooks`} />
          <ButtonTooltip
            variant="primary"
            onClick={() => setShowCreateHookForm(true)}
            disabled={!canCreateWebhooks}
            tooltip={{
              content: {
                side: 'bottom',
                text: getWriteGrantTooltip(writeGrant.status, 'create', 'webhooks'),
              },
            }}
          >
            Create webhook
          </ButtonTooltip>
        </div>
      </div>

      {isLoading && (
        <div className="py-4">
          <GenericSkeletonLoader />
        </div>
      )}

      {readGrant.status === 'denied' && <NoPermission resourceText="view database webhooks" />}

      {readGrant.status === 'error' && (
        <AlertError
          error={readGrant.error}
          subject="Failed to check database webhooks permissions"
        />
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
