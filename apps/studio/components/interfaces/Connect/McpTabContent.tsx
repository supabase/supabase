import { IS_PLATFORM, useParams } from 'common'
import Panel from 'components/ui/Panel'
import { BASE_PATH } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import { createMcpCopyHandler, McpConfigPanel, type McpClient } from 'ui-patterns/McpUrlBuilder'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import type { projectKeys } from './Connect.types'

export const McpTabContent = ({ projectKeys }: { projectKeys: projectKeys }) => {
  const { ref: projectRef } = useParams()

  return (
    <Panel className="bg-inherit border-none shadow-none">
      {projectRef ? (
        <McpTabContentInnerLoaded projectRef={projectRef} projectKeys={projectKeys} />
      ) : (
        <McpTabContentInnerLoading />
      )}
    </Panel>
  )
}

const McpTabContentInnerLoading = () => {
  return (
    <div className="flex flex-col gap-2">
      <ShimmeringLoader className="w-3/4" />
      <ShimmeringLoader className="w-1/2" />
    </div>
  )
}

const McpTabContentInnerLoaded = ({
  projectRef,
  projectKeys,
}: {
  projectRef: string
  projectKeys: projectKeys
}) => {
  const { resolvedTheme } = useTheme()
  const track = useTrack()
  const [selectedClient, setSelectedClient] = useState<McpClient | null>(null)

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

  const handleInstall = () => {
    if (selectedClient?.label) {
      track('mcp_install_button_clicked', {
        client: selectedClient.label,
        source: 'studio',
      })
    }
  }

  return (
    <McpConfigPanel
      basePath={BASE_PATH}
      projectRef={projectRef}
      theme={resolvedTheme as 'light' | 'dark'}
      isPlatform={IS_PLATFORM}
      apiUrl={projectKeys.apiUrl ?? undefined}
      onCopyCallback={handleCopy}
      onInstallCallback={handleInstall}
      onClientSelect={setSelectedClient}
    />
  )
}
