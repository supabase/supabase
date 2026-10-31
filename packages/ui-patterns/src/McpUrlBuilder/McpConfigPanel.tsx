'use client'

import { ChevronRight } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger, Label, Separator } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { InfoTooltip } from '../info-tooltip'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '../multi-select'
import {
  FEATURE_GROUPS_NON_PLATFORM,
  FEATURE_GROUPS_PLATFORM,
  MCP_CLIENT_GROUPS,
} from './clients.data'
import { ClientSelectDropdown } from './components/ClientSelectDropdown'
import { McpConfigurationDisplay } from './components/McpConfigurationDisplay'
import { McpConfigurationOptions } from './components/McpConfigurationOptions'
import { MCP_CLIENTS } from './mcpClients'
import type { McpClient, McpOnCopyCallback } from './types'
import { getMcpUrl, type McpSkipElicitation } from './utils/getMcpUrl'

const CLIENT_GROUPS = MCP_CLIENT_GROUPS.map((group) => ({
  heading: group.heading,
  clients: group.keys
    .map((key) => MCP_CLIENTS.find((c) => c.key === key))
    .filter(Boolean) as (typeof MCP_CLIENTS)[number][],
}))

export interface McpConfigPanelProps {
  projectRef?: string
  initialSelectedClient?: McpClient
  onClientSelect?: (client: McpClient) => void
  onCopyCallback: (type?: McpOnCopyCallback) => void
  onInstallCallback?: () => void
  theme?: 'light' | 'dark'
  className?: string
  isPlatform: boolean // For docs this is controlled by state, for studio by environment variable
  apiUrl?: string
  /** Overrides the NEXT_PUBLIC_MCP_URL/DEFAULT_MCP_URL_PLATFORM fallback for the hosted MCP server */
  platformUrl?: string
  /** Overrides the DEFAULT_MCP_URL_NON_PLATFORM fallback for the self-hosted MCP server (used when apiUrl is unset) */
  nonPlatformUrl?: string
}

export function McpConfigPanel({
  projectRef,
  initialSelectedClient,
  onClientSelect,
  onCopyCallback,
  onInstallCallback,
  className,
  theme = 'dark',
  isPlatform,
  apiUrl,
  platformUrl,
  nonPlatformUrl,
}: McpConfigPanelProps) {
  const [readonly, setReadonly] = useState(false)
  const supportedFeatures = isPlatform ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(() =>
    supportedFeatures.filter((group) => group.id !== 'storage').map((group) => group.id)
  )
  const [selectedClient, setSelectedClient] = useState(initialSelectedClient ?? MCP_CLIENTS[0])
  const [skipElicitations, setSkipElicitations] = useState<McpSkipElicitation[]>([])

  const selectedFeaturesSupported = useMemo(() => {
    return selectedFeatures.filter((feature) =>
      supportedFeatures.some((group) => group.id === feature)
    )
  }, [selectedFeatures, supportedFeatures])

  const eligibleSkipElicitations: McpSkipElicitation[] = []
  if (isPlatform && !readonly) {
    if (selectedFeaturesSupported.includes('database')) {
      eligibleSkipElicitations.push('execute_sql', 'apply_migration')
    }
    if (!projectRef && selectedFeaturesSupported.includes('account')) {
      eligibleSkipElicitations.push('create_project')
      if (selectedFeaturesSupported.includes('branching')) {
        eligibleSkipElicitations.push('create_branch')
      }
    }
  }
  const validSkipElicitations = skipElicitations.filter((tool) =>
    eligibleSkipElicitations.includes(tool)
  )
  // Prune during render so changed props cannot commit stale opt-outs or restore them later.
  if (validSkipElicitations.length !== skipElicitations.length) {
    setSkipElicitations(validSkipElicitations)
  }

  const { mcpUrl, clientConfig } = getMcpUrl({
    projectRef,
    isPlatform,
    apiUrl,
    platformUrl,
    nonPlatformUrl,
    readonly,
    features: selectedFeaturesSupported,
    skipElicitations: validSkipElicitations,
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
          readonly={readonly}
          onReadonlyChange={setReadonly}
          selectedFeatures={selectedFeaturesSupported}
          onFeaturesChange={setSelectedFeatures}
          featureGroups={isPlatform ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM}
        />
        {isPlatform && !readonly && (
          <Collapsible className={innerPanelSpacing}>
            <CollapsibleTrigger className="group flex items-center gap-2 text-sm">
              <ChevronRight
                size={16}
                className="transition-transform group-data-[state=open]:rotate-90"
              />
              Advanced
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Skip confirmations for selected tools</Label>
                <InfoTooltip>
                  Select the tools whose confirmation prompts you want to skip. Leave empty to keep
                  the default behavior.
                </InfoTooltip>
              </div>
              {eligibleSkipElicitations.length > 0 ? (
                <MultiSelector
                  values={validSkipElicitations}
                  onValuesChange={(values) =>
                    setSkipElicitations(
                      eligibleSkipElicitations.filter((tool) => values.includes(tool))
                    )
                  }
                >
                  <MultiSelectorTrigger
                    className="w-full"
                    label="None selected"
                    aria-label="Skip confirmations for"
                    badgeLimit="wrap"
                    showIcon={true}
                  />
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {eligibleSkipElicitations.map((tool) => (
                        <MultiSelectorItem key={tool} value={tool}>
                          <code>{tool}</code>
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              ) : (
                <p className="text-xs text-foreground-light">
                  No eligible tools with the current options. Adjust the connection scope or enabled
                  features.
                </p>
              )}
              {projectRef ? (
                <p className="text-xs text-foreground-light">
                  Skipping cost confirmations is unavailable for project-scoped connections because
                  the legacy cost confirmation workflow requires account-level tools.
                </p>
              ) : !selectedFeaturesSupported.includes('account') ? (
                <p className="text-xs text-foreground-light">
                  Enable the account feature to skip confirmations for <code>create_project</code>{' '}
                  or <code>create_branch</code>.
                </p>
              ) : !selectedFeaturesSupported.includes('branching') ? (
                <p className="text-xs text-foreground-light">
                  Enable the branching feature to skip confirmations for <code>create_branch</code>.
                </p>
              ) : null}
            </CollapsibleContent>
          </Collapsible>
        )}
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
          groups={CLIENT_GROUPS}
          selectedClient={selectedClient}
          onClientChange={handleClientChange}
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
        {validSkipElicitations.length > 0 && selectedClient.key === 'kiro' && (
          <p className={cn('text-xs text-foreground-light', innerPanelSpacing)}>
            The Kiro power uses a fixed configuration and ignores these options. Use manual
            configuration to apply them.
          </p>
        )}
        {validSkipElicitations.length > 0 && selectedClient.key === 'gemini-cli' && (
          <p className={cn('text-xs text-foreground-light', innerPanelSpacing)}>
            The Gemini extension install ignores your confirmation skip selections. Use the
            add-server command shown here or manual configuration to apply them.
          </p>
        )}
        {validSkipElicitations.length > 0 &&
          ['claude-ai', 'chatgpt'].includes(selectedClient.key) && (
            <p className={cn('text-xs text-foreground-light', innerPanelSpacing)}>
              Claude.ai and ChatGPT directory installs use a fixed configuration and ignore these
              options.
            </p>
          )}
        <McpConfigurationDisplay
          className={innerPanelSpacing}
          theme={theme}
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
