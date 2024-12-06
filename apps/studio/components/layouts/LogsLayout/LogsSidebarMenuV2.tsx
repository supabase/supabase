import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/shadcn/ui/tooltip'
import { IS_PLATFORM, useParams } from 'common'
import { CreateWarehouseCollectionModal } from 'components/interfaces/DataWarehouse/CreateWarehouseCollection'
import { WarehouseMenuItem } from 'components/interfaces/DataWarehouse/WarehouseMenuItem'
import SavedQueriesItem from 'components/interfaces/Settings/Logs/Logs.SavedQueriesItem'
import { LogsSidebarItem } from 'components/interfaces/Settings/Logs/SidebarV2/SidebarItem'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'
import { useWarehouseTenantQuery } from 'data/analytics/warehouse-tenant-query'
import { useContentQuery } from 'data/content/content-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useFlag } from 'hooks/ui/useFlag'
import { ArrowUpRight, ChevronRight, DatabaseIcon, FilePlus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideMenuItem,
} from 'ui-patterns/InnerSideMenu'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const SupaIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 24 24"
      height="15px"
      width="15px"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.9997 2.59833V13.9694H3.90013C3.23055 13.9694 2.83063 13.1846 3.25654 12.6326L10.9997 2.59833ZM12.9997 8.03061V2.33296C12.9997 0.521514 10.7034 -0.291434 9.58194 1.16185L1.67316 11.4108C0.246185 13.26 1.54768 15.9694 3.90013 15.9694H10.9997V21.6671C10.9997 23.4785 13.296 24.2915 14.4175 22.8382L22.3262 12.5892C23.7532 10.74 22.4517 8.03061 20.0993 8.03061H12.9997ZM12.9997 10.0306H20.0993C20.7688 10.0306 21.1688 10.8155 20.7429 11.3674L12.9997 21.4017V10.0306Z"></path>
    </svg>
  )
}

export function SidebarCollapsible({
  children,
  title,
  defaultOpen,
}: {
  children: React.ReactNode
  title: string
  defaultOpen?: boolean
}) {
  return (
    <Collapsible_Shadcn_ defaultOpen={defaultOpen}>
      <CollapsibleTrigger_Shadcn_ className="flex items-center gap-x-2 px-4 [&[data-state=open]>svg]:!rotate-90 pb-2">
        <ChevronRight
          size={16}
          className={'text-foreground-light transition-transform duration-200'}
        />

        <span className="text-foreground-light font-mono text-sm uppercase">{title}</span>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_>{children}</CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}

export function LogsSidebarMenuV2() {
  const [searchText, setSearchText] = useState('')
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)
  const canCreateCollection = useCheckPermissions(PermissionAction.ANALYTICS_WRITE, 'logflare')
  const router = useRouter()
  const { ref } = useParams() as { ref: string }
  const { data: tenantData } = useWarehouseTenantQuery({ projectRef: ref })
  const {
    projectAuthAll: authEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled(['project_storage:all', 'project_auth:all', 'realtime:all'])
  const warehouseEnabled = useFlag('warehouse')
  const { data: whCollections, isLoading: whCollectionsLoading } = useWarehouseCollectionsQuery(
    { projectRef: ref },
    { enabled: IS_PLATFORM && warehouseEnabled && !!tenantData }
  )

  const { data: savedQueriesRes, isLoading: savedQueriesLoading } = useContentQuery(ref)

  const savedQueries = [...(savedQueriesRes?.content ?? [])]
    .filter((c) => c.type === 'log_sql')
    .sort((a, b) => a.name.localeCompare(b.name))

  function isActive(path: string) {
    return router.asPath.includes(path)
  }

  const BASE_COLLECTIONS = [
    {
      name: 'API Gateway',
      key: 'edge-logs',
      url: `/project/${ref}/logs/edge-logs`,
      items: [],
    },
    {
      name: 'Postgres',
      key: 'postgres-logs',
      url: `/project/${ref}/logs/postgres-logs`,
      items: [],
    },
    {
      name: 'PostgREST',
      key: 'postgrest-logs',
      url: `/project/${ref}/logs/postgrest-logs`,
      items: [],
    },
    IS_PLATFORM
      ? {
          name: 'Pooler',
          key: 'pooler-logs',
          url: `/project/${ref}/logs/pooler-logs`,
          items: [],
        }
      : null,
    ,
    authEnabled
      ? {
          name: 'Auth',
          key: 'auth-logs',
          url: `/project/${ref}/logs/auth-logs`,
          items: [],
        }
      : null,
    storageEnabled
      ? {
          name: 'Storage',
          key: 'storage-logs',
          url: `/project/${ref}/logs/storage-logs`,
          items: [],
        }
      : null,
    realtimeEnabled
      ? {
          name: 'Realtime',
          key: 'realtime-logs',
          url: `/project/${ref}/logs/realtime-logs`,
          items: [],
        }
      : null,
    {
      name: 'Edge Functions',
      key: 'edge-functions-logs',
      url: `/project/${ref}/logs/edge-functions-logs`,
      items: [],
    },
    {
      name: 'Cron',
      key: 'pg_cron',
      url: `/project/${ref}/logs/pgcron-logs`,
      items: [],
    },
  ]

  const filteredLogs = BASE_COLLECTIONS.filter((collection) => {
    return collection?.name.toLowerCase().includes(searchText.toLowerCase())
  })
  const filteredWarehouse = whCollections?.filter((collection) => {
    return collection.name.toLowerCase().includes(searchText.toLowerCase())
  })

  return (
    <div className="pb-12 relative">
      <div className="flex gap-2 p-4 items-center sticky top-0 bg-background-200 z-[1]">
        <InnerSideBarFilters className="w-full p-0 gap-0">
          <InnerSideBarFilterSearchInput
            name="search-collections"
            placeholder="Search collections..."
            aria-labelledby="Search collections"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          ></InnerSideBarFilterSearchInput>
        </InnerSideBarFilters>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              icon={<Plus className="text-foreground" />}
              className="w-[26px]"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-x-2" asChild>
              <Link href={`/project/${ref}/logs/explorer`}>
                <FilePlus size={14} />
                Create query
              </Link>
            </DropdownMenuItem>
            {warehouseEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem className="gap-x-2" asChild>
                    <button
                      onClick={() => setCreateCollectionOpen(true)}
                      className="w-full flex items-center text-xs px-2 py-1"
                      disabled={!canCreateCollection}
                    >
                      <Plus size={14} />
                      Create collection
                    </button>
                  </DropdownMenuItem>
                </TooltipTrigger>
                {!canCreateCollection && (
                  <TooltipContent>
                    You need additional permissions to create a collection
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateWarehouseCollectionModal
          open={createCollectionOpen}
          onOpenChange={setCreateCollectionOpen}
        />
      </div>
      <div className="px-2">
        <InnerSideMenuItem
          title="Templates"
          isActive={isActive(`/project/${ref}/logs/explorer/templates`)}
          href={`/project/${ref}/logs/explorer/templates`}
        >
          Templates
        </InnerSideMenuItem>
      </div>
      <Separator className="my-4" />

      <SidebarCollapsible title="Collections" defaultOpen={true}>
        {filteredLogs.map((collection) => (
          <LogsSidebarItem
            isActive={isActive(collection?.url ?? '')}
            href={collection?.url ?? ''}
            key={collection?.key}
            icon={<SupaIcon className="text-foreground-light" />}
            label={collection?.name ?? ''}
          />
        ))}
        {whCollectionsLoading && warehouseEnabled ? (
          <div className="p-4">
            <GenericSkeletonLoader />
          </div>
        ) : filteredWarehouse?.length ? (
          <div>
            {filteredWarehouse.map((collection) => (
              <WarehouseMenuItem item={collection} key={collection.token}></WarehouseMenuItem>
            ))}
          </div>
        ) : null}
      </SidebarCollapsible>
      <Separator className="my-4" />
      <SidebarCollapsible title="Queries" defaultOpen={true}>
        {savedQueriesLoading && (
          <div className="p-4">
            <GenericSkeletonLoader />
          </div>
        )}
        {savedQueries.length === 0 && (
          <InnerSideBarEmptyPanel
            className="mx-4"
            title="No queries created yet"
            description="Create and save your queries to use them in the explorer"
            actions={
              <Button asChild type="default">
                <Link href={`/project/${ref}/logs/explorer`}>Create query</Link>
              </Button>
            }
          />
        )}
        {savedQueries.map((query) => (
          <SavedQueriesItem item={query} key={query.id} />
        ))}
      </SidebarCollapsible>
    </div>
  )
}
