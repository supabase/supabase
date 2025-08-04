'use client'

import React, { useState } from 'react'
import { cn, Separator } from 'ui'

import { McpAddToClientButton } from './components/AddToClientButton'
import { ClientSelectDropdown } from './components/ClientSelectDropdown'
import { McpConfigurationDisplay } from './components/McpConfigurationDisplay'
import { McpConfigurationOptions } from './components/McpConfigurationOptions'
import { FEATURE_GROUPS, MCP_CLIENTS } from './constants'
import { getMcpUrl } from './utils/getMcpUrl'
import type { McpClient } from './types'

export interface McpConfigPanelProps {
  basePath: string
  baseUrl?: string
  projectRef?: string
  initialSelectedClient?: McpClient
  onClientSelect?: (client: McpClient) => void
  theme?: 'light' | 'dark'
  className?: string
}

export function McpConfigPanel({
  basePath,
  baseUrl = 'https://api.supabase.com/mcp',
  projectRef,
  initialSelectedClient,
  onClientSelect,
  className,
  theme = 'dark',
}: McpConfigPanelProps) {
  const [readonly, setReadonly] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [selectedClient, setSelectedClient] = useState(initialSelectedClient ?? MCP_CLIENTS[0])

  const { clientConfig } = getMcpUrl({
    baseUrl,
    projectRef,
    readonly,
    features: selectedFeatures,
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
        <h3 className={innerPanelSpacing}>Options</h3>
        <Separator />
        <McpConfigurationOptions
          className={innerPanelSpacing}
          readonly={readonly}
          onReadonlyChange={setReadonly}
          selectedFeatures={selectedFeatures}
          onFeaturesChange={setSelectedFeatures}
          featureGroups={FEATURE_GROUPS}
        />
      </div>
      <div className={cn('border rounded-lg')}>
        <div className={cn('flex items-center justify-between', innerPanelSpacing)}>
          <h3>Installation</h3>
          <McpAddToClientButton
            theme={theme}
            basePath={basePath}
            selectedClient={selectedClient}
            clientConfig={clientConfig}
          />
        </div>
        <Separator />
        <McpConfigurationDisplay
          className={innerPanelSpacing}
          selectedClient={selectedClient}
          clientConfig={clientConfig}
        />
      </div>
    </div>
  )
}
