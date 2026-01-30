import { useParams } from 'common'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { useMemo } from 'react'
import {
  createMcpCopyHandler,
  FEATURE_GROUPS_NON_PLATFORM,
  FEATURE_GROUPS_PLATFORM,
  getMcpUrl,
  MCP_CLIENTS,
  McpConfigurationDisplay,
} from 'ui-patterns/McpUrlBuilder'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { StepContentProps } from '../../../../Connect.types'

function McpCursorContent({ state, projectKeys }: StepContentProps) {
  const { ref: projectRef } = useParams()

  if (!projectRef) {
    return (
      <div className="flex flex-col gap-2">
        <ShimmeringLoader className="w-3/4" />
        <ShimmeringLoader className="w-1/2" />
      </div>
    )
  }

  return <McpCursorContentInner projectRef={projectRef} projectKeys={projectKeys} state={state} />
}

function McpCursorContentInner({
  projectRef,
  projectKeys,
  state,
}: {
  projectRef: string
  projectKeys: StepContentProps['projectKeys']
  state: StepContentProps['state']
}) {
  const track = useTrack()

  const selectedClient = useMemo(() => {
    const clientKey = String(state.mcpClient ?? '')
    return MCP_CLIENTS.find((c) => c.key === clientKey) ?? MCP_CLIENTS[0]
  }, [state.mcpClient])

  const readonly = Boolean(state.mcpReadonly)
  const selectedFeatures = Array.isArray(state.mcpFeatures) ? state.mcpFeatures : []

  const selectedFeaturesSupported = useMemo(() => {
    const supportedFeatures = IS_PLATFORM ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM
    return selectedFeatures.filter((feature) =>
      supportedFeatures.some((group) => group.id === feature)
    )
  }, [selectedFeatures])

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

export default McpCursorContent
