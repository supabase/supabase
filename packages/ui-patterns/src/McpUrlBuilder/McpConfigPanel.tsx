'use client'

import React, { useMemo, useState } from 'react'
import { cn, CodeBlock, Separator } from 'ui'

import { InfoTooltip } from '../info-tooltip'
import { ClientSelectDropdown } from './components/ClientSelectDropdown'
import { McpConfigurationDisplay } from './components/McpConfigurationDisplay'
import { McpConfigurationOptions } from './components/McpConfigurationOptions'
import { FEATURE_GROUPS_NON_PLATFORM, FEATURE_GROUPS_PLATFORM, MCP_CLIENTS } from './constants'
import type { McpClient, McpOnCopyCallback } from './types'
import { getMcpUrl } from './utils/getMcpUrl'

export interface McpConfigPanelProps {
  basePath: string
  baseUrl?: string
  projectRef?: string
  initialSelectedClient?: McpClient
  onClientSelect?: (client: McpClient) => void
  onCopyCallback: (type?: McpOnCopyCallback) => void
  onInstallCallback?: () => void
  theme?: 'light' | 'dark'
  className?: string
  isPlatform: boolean // For docs this is controlled by state, for studio by environment variable
  apiUrl?: string
}

export function McpConfigPanel({
  basePath,
  projectRef,
  initialSelectedClient,
  onClientSelect,
  onCopyCallback,
  onInstallCallback,
  className,
  theme = 'dark',
  isPlatform,
  apiUrl,
}: McpConfigPanelProps) {
  const [readonly, setReadonly] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [selectedClient, setSelectedClient] = useState(initialSelectedClient ?? MCP_CLIENTS[0])

  const supportedFeatures = isPlatform ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM
  const selectedFeaturesSupported = useMemo(() => {
    return selectedFeatures.filter((feature) =>
      supportedFeatures.some((group) => group.id === feature)
    )
  }, [selectedFeatures, supportedFeatures])

  const { mcpUrl, clientConfig } = getMcpUrl({
    projectRef,
    isPlatform,
    apiUrl,
    readonly,
    features: selectedFeaturesSupported,
    selectedClient,
  })

  const handleClientChange = (clientKey: string) => {
    const client = MCP_CLIENTS.find((c) => c.key === clientKey)
    if (client) {
      setSelectedClient(client)
    }
  }
  React.useEffect(() => {
    onClientSelect?.(selectedClient)
  }, [selectedClient, onClientSelect])

  const innerPanelSpacing = 'px-4 py-3'

  return (
    <div className={cn('space-y-6', className)}>
      <div className={cn('border rounded-lg')}>
        <h3 className={innerPanelSpacing}>Options</h3>
        <Separator />
        <McpConfigurationOptions
          className={innerPanelSpacing}
          isPlatform={isPlatform}
          readonly={readonly}
          onReadonlyChange={setReadonly}
          selectedFeatures={selectedFeaturesSupported}
          onFeaturesChange={setSelectedFeatures}
          featureGroups={isPlatform ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM}
        />
        <div className={innerPanelSpacing}>
          <CodeBlock
            focusable={false}
            title={
              <div className="flex items-center gap-2">
                Server URL
                <InfoTooltip>
                  {`MCP clients should support the Streamable HTTP transport${isPlatform ? ' and OAuth 2.1 with dynamic client registration' : ''}`}
                </InfoTooltip>
              </div>
            }
            hideLineNumbers
            language="http"
            className="max-h-64 overflow-y-auto"
            onCopyCallback={() => onCopyCallback?.('url')}
          >
            {mcpUrl}
          </CodeBlock>
        </div>
      </div>
      <div className="flex flex-col gap-y-3">
        <ClientSelectDropdown
          label="Client"
          clients={MCP_CLIENTS}
          selectedClient={selectedClient}
          onClientChange={handleClientChange}
          basePath={basePath}
          theme={theme}
        />
        <p className="text-xs text-foreground-lighter">
          Configure your MCP client to connect with your Supabase project
        </p>
      </div>
      <div className={cn('border rounded-lg')}>
        <div className={innerPanelSpacing}>
          <h3>Installation</h3>
        </div>
        <Separator />
        <McpConfigurationDisplay
          className={innerPanelSpacing}
          theme={theme}
          basePath={basePath}
          selectedClient={selectedClient}
          clientConfig={clientConfig}
          onCopyCallback={onCopyCallback}
          onInstallCallback={onInstallCallback}
          isPlatform={isPlatform}
        />
      </div>
    </div>
  )
}
