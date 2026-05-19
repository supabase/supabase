import { IS_PLATFORM, useFlag, useParams } from 'common'
import { ChevronRight, CircleHelpIcon, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import {
  Badge,
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Separator,
} from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideMenuItem,
} from 'ui-patterns/InnerSideMenu'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { FeaturePreviewSidebarPanel } from '../../ui/FeaturePreviewSidebarPanel'
import {
  useFeaturePreviewModal,
  useUnifiedLogsPreview,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsETLPrivateAlpha } from '@/components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import { LOG_DRAIN_TYPES } from '@/components/interfaces/LogDrains/LogDrains.constants'
import SavedQueriesItem from '@/components/interfaces/Settings/Logs/Logs.SavedQueriesItem'
import { LogsSidebarItem } from '@/components/interfaces/Settings/Logs/SidebarV2/SidebarItem'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useContentQuery } from '@/data/content/content-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

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
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center gap-x-2 px-4 [&[data-state=open]>svg]:rotate-90! pb-2">
        <ChevronRight
          size={16}
          className={'text-foreground-light transition-transform duration-200'}
        />

        <span className="text-foreground-light font-mono text-sm uppercase">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

export function LogsSidebarMenuV2() {
  const router = useRouter()
  const { ref } = useParams() as { ref: string }

  const unifiedLogsFlagEnabled = useFlag('unifiedLogs')
  const { selectFeaturePreview } = useFeaturePreviewModal()
  const { enable: enableUnifiedLogs, isEligible: isUnifiedLogsEligible } = useUnifiedLogsPreview()

  const [searchText, setSearchText] = useState('')

  const {
    projectAuthAll: authEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
    logsTemplates: templatesEnabled,
    logsCollections: collectionsEnabled,
  } = useIsFeatureEnabled([
    'project_storage:all',
    'project_auth:all',
    'realtime:all',
    'logs:templates',
    'logs:collections',
  ])

  const enablePgReplicate = useIsETLPrivateAlpha()
  const { data: etlData, isPending: isETLLoading } = useReplicationSourcesQuery(
    {
      projectRef: ref,
    },
    {
      enabled: enablePgReplicate,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  )

  // [Jordi] We only want to show ETL logs if the user has the feature enabled AND they're using the feature aka they've created a source.
  const showETLLogs = enablePgReplicate && (etlData?.sources?.length ?? 0) > 0 && !isETLLoading

  const { hasAccess: hasDedicatedPooler } = useCheckEntitlements('dedicated_pooler')

  const { data: savedQueriesRes, isPending: savedQueriesLoading } = useContentQuery({
    projectRef: ref,
    type: 'log_sql',
  })

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
          name: hasDedicatedPooler ? 'Shared Pooler' : 'Pooler',
          key: 'pooler-logs',
          url: `/project/${ref}/logs/pooler-logs`,
          items: [],
        }
      : null,
    hasDedicatedPooler && IS_PLATFORM
      ? {
          name: 'Dedicated Pooler',
          key: 'dedicated-pooler-logs',
          url: `/project/${ref}/logs/dedicated-pooler-logs`,
          items: [],
        }
      : null,
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
    showETLLogs
      ? {
          name: 'Replication',
          key: 'replication_logs',
          url: `/project/${ref}/logs/replication-logs`,
          items: [],
        }
      : null,
  ].filter((x) => x !== null)

  const OPERATIONAL_COLLECTIONS = IS_PLATFORM
    ? [
        {
          name: 'Postgres Version Upgrade',
          key: 'pg-upgrade-logs',
          url: `/project/${ref}/logs/pg-upgrade-logs`,
          items: [],
        },
      ]
    : []

  const filteredLogs = BASE_COLLECTIONS.filter((collection) => {
    return collection?.name.toLowerCase().includes(searchText.toLowerCase())
  })
  const filteredOperationalLogs = OPERATIONAL_COLLECTIONS.filter((collection) => {
    return collection?.name.toLowerCase().includes(searchText.toLowerCase())
  })

  return (
    <div className="pb-4 relative">
      {IS_PLATFORM && !unifiedLogsFlagEnabled && (
        <FeaturePreviewSidebarPanel
          className="mx-4 mt-4"
          illustration={<Badge variant="default">Coming soon</Badge>}
          title="New logs"
          description="Get early access"
          actions={
            <Link href="https://forms.supabase.com/unified-logs-signup" target="_blank">
              <Button type="default" size="tiny">
                Early access
              </Button>
            </Link>
          }
        />
      )}
      {isUnifiedLogsEligible && (
        <FeaturePreviewSidebarPanel
          className="mx-4 mt-4"
          title="Introducing unified logs"
          description="A unified view across all services with improved filtering and real-time updates."
          illustration={<Badge variant="success">New</Badge>}
          actions={
            <>
              <Button
                size="tiny"
                type="default"
                onClick={() => {
                  enableUnifiedLogs()
                  router.push(`/project/${ref}/logs`)
                }}
              >
                Enable preview
              </Button>
              <ButtonTooltip
                type="default"
                className="px-1.5"
                icon={<CircleHelpIcon />}
                onClick={() => selectFeaturePreview('supabase-ui-preview-unified-logs')}
                tooltip={{ content: { side: 'bottom', text: 'More information' } }}
              />
            </>
          }
        />
      )}

      <div
        className={cn(
          'flex gap-x-2 items-center sticky top-0 bg-background-200 z-1 px-4',
          !templatesEnabled ? 'pt-4' : 'py-4'
        )}
      >
        <InnerSideBarFilters className="w-full p-0 gap-0">
          <InnerSideBarFilterSearchInput
            name="search-collections"
            placeholder="Search collections..."
            aria-labelledby="Search collections"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          ></InnerSideBarFilterSearchInput>
        </InnerSideBarFilters>

        <Button
          type="default"
          icon={<Plus className="text-foreground" />}
          className="w-[26px]"
          onClick={() => router.push(`/project/${ref}/logs/explorer`)}
        />
      </div>
      {templatesEnabled && (
        <div className="px-2">
          <InnerSideMenuItem
            title="Templates"
            isActive={isActive(`/project/${ref}/logs/explorer/templates`)}
            href={`/project/${ref}/logs/explorer/templates`}
          >
            Templates
          </InnerSideMenuItem>
        </div>
      )}
      <Separator className="my-4" />

      {collectionsEnabled && (
        <>
          <SidebarCollapsible title="Collections" defaultOpen={true}>
            {filteredLogs.map((collection) => {
              const isItemActive = isActive(collection?.url ?? '')
              return (
                <LogsSidebarItem
                  key={collection?.key ?? ''}
                  isActive={isItemActive}
                  href={collection?.url ?? ''}
                  label={collection?.name ?? ''}
                />
              )
            })}
          </SidebarCollapsible>
          {OPERATIONAL_COLLECTIONS.length > 0 && (
            <>
              <Separator className="my-4" />
              <SidebarCollapsible title="Database operations" defaultOpen={true}>
                {filteredOperationalLogs.map((collection) => (
                  <LogsSidebarItem
                    key={collection.key}
                    isActive={isActive(collection.url)}
                    href={collection.url}
                    label={collection.name}
                  />
                ))}
              </SidebarCollapsible>
            </>
          )}
          <Separator className="my-4" />
        </>
      )}
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

      <Separator className="my-4" />

      <FeaturePreviewSidebarPanel
        className="mx-4 mt-4"
        title="Capture your logs"
        description="Send logs to your preferred observability or storage platform."
        illustration={
          <div className="flex items-center gap-4">
            {LOG_DRAIN_TYPES.filter((t) =>
              ['datadog', 'sentry', 'webhook', 'loki'].includes(t.value)
            ).map((type) =>
              React.cloneElement(type.icon, { key: type.name, height: 20, width: 20 })
            )}
          </div>
        }
        actions={
          <Button asChild type="default">
            <Link href={`/project/${ref}/settings/log-drains`}>Go to Log Drains</Link>
          </Button>
        }
      />
    </div>
  )
}
