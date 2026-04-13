import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef } from 'react'
import { cn, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'

import type { ConnectMode, ProjectKeys } from './Connect.types'
import { CONNECT_MODES } from './Connect.types'
import { ConnectConfigSection, ModeSelector } from './ConnectConfigSection'
import { ConnectStepsSection } from './ConnectStepsSection'
import { useAvailableConnectModes } from './useAvailableConnectModes'
import { useConnectState } from './useConnectState'
import { getKeys, useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

function isConnectMode(value: string): value is ConnectMode {
  return CONNECT_MODES.some((mode) => mode === value)
}

function mapConnectTabToMode(tab: string | null): ConnectMode | null {
  if (!tab) return null
  switch (tab) {
    case 'frameworks':
    case 'mobiles':
      return 'framework'
    case 'orms':
      return 'orm'
    default:
      return isConnectMode(tab) ? tab : null
  }
}

export const ConnectSheet = () => {
  const { ref: projectRef } = useParams()

  const availableModeIds = useAvailableConnectModes()

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )
  const [connectTab, setConnectTab] = useQueryState('connectTab', parseAsString)
  const [queryFramework, setQueryFramework] = useQueryState('framework', parseAsString)
  const [queryUsing, setQueryUsing] = useQueryState('using', parseAsString)
  const [queryMethod, setQueryMethod] = useQueryState('method', parseAsString)
  const [queryType, setQueryType] = useQueryState('type', parseAsString)
  const [queryMcpClient, setQueryMcpClient] = useQueryState('mcpClient', parseAsString)
  const { connectSheetSource, setConnectSheetSource } = useAppStateSnapshot()
  const track = useTrack()
  const prevShowConnect = useRef(false)

  const { state, activeFields, resolvedSteps, schema, getFieldOptions, setMode, updateField } =
    useConnectState()

  useEffect(() => {
    const justOpened = showConnect && !prevShowConnect.current
    prevShowConnect.current = showConnect

    if (!justOpened) return

    track('connect_sheet_opened', { source: connectSheetSource })
    setConnectSheetSource('header_button')

    const mappedMode = mapConnectTabToMode(connectTab)
    if (mappedMode && availableModeIds.includes(mappedMode)) {
      setMode(mappedMode)
    }

    if (mappedMode === 'framework') {
      if (queryFramework) {
        updateField('framework', queryFramework)
        if (queryUsing) updateField('frameworkVariant', queryUsing)
      }
    } else if (mappedMode === 'orm') {
      if (queryFramework) updateField('orm', queryFramework)
    } else if (mappedMode === 'direct') {
      if (queryMethod) updateField('connectionMethod', queryMethod)
      if (queryType) updateField('connectionType', queryType)
    } else if (mappedMode === 'mcp') {
      if (queryMcpClient) updateField('mcpClient', queryMcpClient)
    }
  }, [
    showConnect,
    connectSheetSource,
    connectTab,
    queryFramework,
    queryUsing,
    queryMethod,
    queryType,
    queryMcpClient,
    availableModeIds,
    track,
    setConnectSheetSource,
    setMode,
    updateField,
  ])

  const clearAllQueryParams = () => {
    setConnectTab(null)
    setQueryFramework(null)
    setQueryUsing(null)
    setQueryMethod(null)
    setQueryType(null)
    setQueryMcpClient(null)
  }

  const handleOpenChange = (sheetOpen: boolean) => {
    if (!sheetOpen) clearAllQueryParams()
    setShowConnect(sheetOpen)
  }

  const { data: endpoint = '' } = useProjectApiUrl({ projectRef }, { enabled: showConnect })

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )
  const { data: apiKeys } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })
  const { anonKey, publishableKey } = canReadAPIKeys
    ? getKeys(apiKeys)
    : { anonKey: null, publishableKey: null }

  const projectKeys: ProjectKeys = useMemo(() => {
    return {
      apiUrl: endpoint,
      anonKey: anonKey?.api_key ?? null,
      publishableKey: publishableKey?.api_key ?? null,
    }
  }, [endpoint, anonKey?.api_key, publishableKey?.api_key])

  const availableModes = useMemo(
    () => schema.modes.filter((m) => availableModeIds.includes(m.id)),
    [schema.modes, availableModeIds]
  )

  const handleModeChange = (mode: ConnectMode) => {
    setMode(mode)
    setConnectTab(mode)
    setQueryFramework(null)
    setQueryUsing(null)
    setQueryMethod(null)
    setQueryType(null)
    setQueryMcpClient(null)
  }

  const handleFieldChange = (fieldId: string, value: string | boolean | string[]) => {
    updateField(fieldId, value)
    const str = String(value)
    if (fieldId === 'framework') {
      setQueryFramework(str)
      setQueryUsing(null)
    } else if (fieldId === 'frameworkVariant') {
      setQueryUsing(str)
    } else if (fieldId === 'orm') {
      setQueryFramework(str)
    } else if (fieldId === 'connectionMethod') {
      setQueryMethod(str)
      setQueryType(null)
    } else if (fieldId === 'connectionType') {
      setQueryType(str)
    } else if (fieldId === 'mcpClient') {
      setQueryMcpClient(str)
    }
  }

  return (
    <Sheet open={showConnect} onOpenChange={handleOpenChange}>
      <SheetContent size="lg" className="flex flex-col gap-0 p-0 space-y-0" tabIndex={undefined}>
        <SheetHeader className={cn('text-left border-b shrink-0 py-6 px-8')}>
          <SheetTitle>Connect to your project</SheetTitle>
          <SheetDescription>Choose how you want to use Supabase</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto divide-y">
          <div className="p-8">
            <ModeSelector
              modes={availableModes}
              selected={state.mode}
              onChange={handleModeChange}
            />
          </div>

          <div className="border-b p-8">
            <ConnectConfigSection
              state={state}
              activeFields={activeFields}
              onFieldChange={handleFieldChange}
              getFieldOptions={getFieldOptions}
            />
          </div>

          <ConnectStepsSection steps={resolvedSteps} state={state} projectKeys={projectKeys} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
