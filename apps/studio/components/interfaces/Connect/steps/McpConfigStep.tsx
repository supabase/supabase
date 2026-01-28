import { useMemo } from 'react'
import { useParams } from 'common'
import { useTrack } from 'lib/telemetry/track'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import {
  createMcpCopyHandler,
  FEATURE_GROUPS_NON_PLATFORM,
  FEATURE_GROUPS_PLATFORM,
  getMcpUrl,
  McpConfigurationDisplay,
  MCP_CLIENTS,
} from 'ui-patterns/McpUrlBuilder'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { ConnectState, ProjectKeys } from '../Connect.types'

interface McpConfigStepProps {
  state: ConnectState
  projectKeys: ProjectKeys
}

export function McpConfigStep({ state, projectKeys }: McpConfigStepProps) {
  const { ref: projectRef } = useParams()

  if (!projectRef) {
    return (
      <div className="flex flex-col gap-2">
        <ShimmeringLoader className="w-3/4" />
        <ShimmeringLoader className="w-1/2" />
      </div>
    )
  }

  return (
    <McpConfigStepInner
      projectRef={projectRef}
      projectKeys={projectKeys}
      state={state}
    />
  )
}

function McpConfigStepInner({
  projectRef,
  projectKeys,
  state,
}: {
  projectRef: string
  projectKeys: ProjectKeys
  state: ConnectState
}) {
  const track = useTrack()

  const selectedClient = useMemo(() => {
    const clientKey = String(state.mcpClient ?? '')
    return MCP_CLIENTS.find((c) => c.key === clientKey) ?? MCP_CLIENTS[0]
  }, [state.mcpClient])

  const readonly = Boolean(state.mcpReadonly)
  const selectedFeatures = Array.isArray(state.mcpFeatures)
    ? state.mcpFeatures
    : []

  const supportedFeatures = IS_PLATFORM
    ? FEATURE_GROUPS_PLATFORM
    : FEATURE_GROUPS_NON_PLATFORM

  const selectedFeaturesSupported = useMemo(() => {
    return selectedFeatures.filter((feature) =>
      supportedFeatures.some((group) => group.id === feature)
    )
  }, [selectedFeatures, supportedFeatures])

  const handleCopy = useMemo(
    () =>
      createMcpCopyHandler({
        selectedClient,
        source: 'studio',
        onTrack: (event) => track(event.action, event.properties, event.groups),
        projectRef,
      }),
    [selectedClient, track, projectRef]
  )

  const { clientConfig } = getMcpUrl({
    projectRef,
    isPlatform: IS_PLATFORM,
    apiUrl: projectKeys.apiUrl ?? undefined,
    readonly,
    features: selectedFeaturesSupported,
    selectedClient,
  })

  return (
    <McpConfigurationDisplay
      className="space-y-4"
      theme="dark"
      basePath={BASE_PATH}
      selectedClient={selectedClient}
      clientConfig={clientConfig}
      onCopyCallback={handleCopy}
    />
  )
}
