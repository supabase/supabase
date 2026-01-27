import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ApiKeysTabContent } from 'components/interfaces/Connect/ApiKeysTabContent'
import type { projectKeys as ProjectKeys } from 'components/interfaces/Connect/Connect.types'
import { ConnectionIcon } from 'components/interfaces/Connect/ConnectionIcon'
import { InlineLink } from 'components/ui/InlineLink'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import { ArrowRight, BookOpen, Plug } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from 'ui'

import {
  QUICK_CONNECT_LEFT_CONFIG,
  QUICK_CONNECT_RIGHT_CARD_CONFIG,
} from './QuickConnect.constants'
import { QuickConnectConnectionString } from './QuickConnectConnectionString'

const QuickConnect = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()

  const [selectedApiTab, setSelectedApiTab] = useState<'connection-string' | 'api-keys'>(
    'connection-string'
  )

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )
  const { data: apiKeys } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })
  const { anonKey, publishableKey } = canReadAPIKeys
    ? getKeys(apiKeys)
    : { anonKey: null, publishableKey: null }

  const projectKeys = useMemo<ProjectKeys>(() => {
    const protocol = settings?.app_config?.protocol ?? 'https'
    const endpoint = settings?.app_config?.endpoint ?? ''
    const apiHost = canReadAPIKeys ? `${protocol}://${endpoint ?? '-'}` : ''

    return {
      apiUrl: apiHost || null,
      anonKey: anonKey?.api_key ?? null,
      publishableKey: publishableKey?.api_key ?? null,
    }
  }, [
    settings?.app_config?.protocol,
    settings?.app_config?.endpoint,
    canReadAPIKeys,
    anonKey?.api_key,
    publishableKey?.api_key,
  ])

  const openConnectDialog = (options?: {
    tab?: string
    framework?: string
    method?: 'direct' | 'transaction' | 'session'
  }) => {
    const { pathname, query } = router

    const nextQuery: Record<string, string> = {
      ...Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])),
      showConnect: 'true',
    }

    if (options?.tab) nextQuery.connectTab = options.tab
    if (options?.framework) nextQuery.framework = options.framework
    if (options?.method) nextQuery.method = options.method

    router.push({ pathname, query: nextQuery }, undefined, { shallow: true })
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2 items-start pt-8 scroll-mt-8" id="quick-connect">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="text-base">{QUICK_CONNECT_LEFT_CONFIG.title}</h2>
            <p className="text-xs text-foreground-light">{QUICK_CONNECT_LEFT_CONFIG.description}</p>
          </div>
          <Button
            type="default"
            size="small"
            className="h-7 px-3 text-xs rounded-full"
            icon={<Plug className="rotate-90" />}
            onClick={() => openConnectDialog()}
          >
            Connect
          </Button>
        </div>

        <div className="flex flex-col gap-7 md:flex-row md:gap-5">
          {QUICK_CONNECT_LEFT_CONFIG.columns.map((column) => (
            <div key={column.id} className="flex-1 flex flex-col gap-7">
              {column.sections.map((section) => (
                <div key={section.id} className="flex flex-col gap-2.5">
                  <p className="text-xs font-mono text-foreground-lighter">{section.label}</p>
                  <div className="h-px w-full bg-border-muted" />
                  <div className="flex flex-col gap-1.5">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="inline-flex items-center gap-1.5 py-0.5 text-left text-xs text-foreground-light hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong rounded"
                        onClick={() =>
                          openConnectDialog({
                            tab: item.target?.tab,
                            framework: item.target?.framework,
                            method: item.target?.method,
                          })
                        }
                      >
                        {item.icon && <ConnectionIcon icon={item.icon} size={20} />}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="">
        <div className="pb-3">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="text-sm">{QUICK_CONNECT_RIGHT_CARD_CONFIG.title}</div>
              <p className="text-xs text-foreground-light">
                {QUICK_CONNECT_RIGHT_CARD_CONFIG.description}
              </p>
            </div>
            <div className="flex items-center">
              <div className="inline-flex items-center gap-0.5 rounded-lg border border-border-strong bg-surface-100 p-0.5">
                <Button
                  type={selectedApiTab === 'api-keys' ? 'secondary' : 'text'}
                  size="tiny"
                  className="h-6 px-3 text-xs"
                  onClick={() => setSelectedApiTab('api-keys')}
                >
                  API Keys
                </Button>
                <Button
                  type={selectedApiTab === 'connection-string' ? 'secondary' : 'text'}
                  size="tiny"
                  className="h-6 px-3 text-xs"
                  onClick={() => setSelectedApiTab('connection-string')}
                >
                  Connection String
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Card className="border-muted bg-surface-100/60">
          <CardContent className="p-0">
            {selectedApiTab === 'connection-string' ? (
              <QuickConnectConnectionString />
            ) : (
              <div className="p-4">
                <ApiKeysTabContent projectKeys={projectKeys} />
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-foreground-lighter">
          <BookOpen size={12} strokeWidth={1.5} className="-mb-px" />
          <span>Learn more on how to</span>
          <a
            href={`${DOCS_URL}/guides/database/connecting-to-postgres`}
            target="_blank"
            rel="noreferrer"
            className="underline text-foreground-light"
          >
            connect to your Postgres databases
          </a>
        </div>
      </div>
    </section>
  )
}

export default QuickConnect
