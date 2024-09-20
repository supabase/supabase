import { IS_PLATFORM, useParams } from 'common'
import { CreateWarehouseCollectionModal } from 'components/interfaces/DataWarehouse/CreateWarehouseCollection'
import { WarehouseMenuItem } from 'components/interfaces/DataWarehouse/WarehouseMenuItem'
import SavedQueriesItem from 'components/interfaces/Settings/Logs/Logs.SavedQueriesItem'
import { LogsSidebarItem } from 'components/interfaces/Settings/Logs/SidebarV2/SidebarItem'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'
import { useContentQuery } from 'data/content/content-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useFlag } from 'hooks/ui/useFlag'
import { ArrowUpRight, ChevronRight, FilePlus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Button,
  cn,
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
  GenericSkeletonLoader,
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideMenuItem,
} from 'ui-patterns'

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

function SidebarCollectionItem({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      data-active={isActive}
      className={cn(
        'text-foreground-light flex gap-2 items-center hover:text-foreground px-4 py-1 hover:bg-foreground-lighter/10 truncate text-sm transition-all',
        {
          'bg-foreground-lighter/10 text-foreground': isActive,
        }
      )}
      href={href}
    >
      {children}
    </Link>
  )
}

export function LogsSidebarMenuV2() {
  const [searchText, setSearchText] = useState('')
  const [order, setOrder] = useState('alphabetical')
  const router = useRouter()
  const { ref } = useParams() as { ref: string }
  const {
    projectAuthAll: authEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled(['project_storage:all', 'project_auth:all', 'realtime:all'])
  const warehouseEnabled = useFlag('warehouse')
  const { data: whCollections, isLoading: whCollectionsLoading } = useWarehouseCollectionsQuery(
    { projectRef: ref },
    { enabled: IS_PLATFORM && warehouseEnabled }
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
  ]

  const filteredLogs = BASE_COLLECTIONS.filter((collection) => {
    return collection?.name.toLowerCase().includes(searchText.toLowerCase())
  })
  const filteredWarehouse = whCollections?.filter((collection) => {
    return collection.name.toLowerCase().includes(searchText.toLowerCase())
  })

  return (
    <div>
      <div className="flex gap-2 p-4 items-center">
        <InnerSideBarFilters className="w-full p-0 gap-0">
          <InnerSideBarFilterSearchInput
            name="search-queries"
            placeholder="Search queries and collections"
            aria-labelledby="Search queries"
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
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem className="gap-x-2" asChild>
              <Link href={`/project/${ref}/logs/explorer`}>
                <FilePlus size={14} />
                Create query
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-x-2" asChild>
              <CreateWarehouseCollectionModal />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="px-2">
        <InnerSideMenuItem
          title="Templates"
          isActive={isActive(`/project/${ref}/logs/explorer/templates`)}
          href={`/project/${ref}/logs/explorer/templates`}
        >
          Templates
        </InnerSideMenuItem>
        <InnerSideMenuItem
          title="Settings"
          isActive={isActive(`/project/${ref}/settings/warehouse`)}
          href={`/project/${ref}/settings/warehouse`}
        >
          Settings
          <ArrowUpRight strokeWidth={1} className="h-4 w-4" />
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
        {whCollectionsLoading ? (
          <GenericSkeletonLoader />
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
        {savedQueries.map((query) => (
          <SavedQueriesItem item={query} key={query.id} />
        ))}
      </SidebarCollapsible>
    </div>
  )
}
