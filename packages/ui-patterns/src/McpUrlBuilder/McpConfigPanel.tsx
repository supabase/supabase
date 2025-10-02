'use client'

import React, { useMemo, useState } from 'react'
import { cn, Separator } from 'ui'

import { ClientSelectDropdown } from './components/ClientSelectDropdown'
import { McpConfigurationDisplay } from './components/McpConfigurationDisplay'
import { McpConfigurationOptions } from './components/McpConfigurationOptions'
import { FEATURE_GROUPS_PLATFORM, FEATURE_GROUPS_NON_PLATFORM, MCP_CLIENTS } from './constants'
import type { McpClient } from './types'
import { getMcpUrl } from './utils/getMcpUrl'

export interface McpConfigPanelProps {
  basePath: string
  baseUrl?: string
  projectRef?: string
  initialSelectedClient?: McpClient
  onClientSelect?: (client: McpClient) => void
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

  const { clientConfig } = getMcpUrl({
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
        />
      </div>
    </div>
  )
}
