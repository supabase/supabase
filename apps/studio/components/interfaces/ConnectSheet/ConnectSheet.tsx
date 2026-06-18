import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef } from 'react'
import { cn, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'

import type { ConnectMode, ProjectKeys } from './Connect.types'
import { CONNECT_MODES } from './Connect.types'
import { ConnectConfigSection, ModeSelector } from './ConnectConfigSection'
import { ConnectStepsSection } from './ConnectStepsSection'
import { useAvailableConnectModes } from './useAvailableConnectModes'
import { useConnectSheetParams } from './useConnectSheetParams'
import { useConnectSheetShortcut } from './useConnectSheetShortcut'
import { useConnectState } from './useConnectState'
import { WarehouseCatalogPanel } from './WarehouseCatalogPanel'
import type { WarehouseCatalogEngine } from '@/components/interfaces/Integrations/WarehouseCatalog/warehouseCatalog.constants'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
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
  const track = useTrack()
  const prevShowConnect = useRef(false)
  const { ref: projectRef } = useParams()

  useConnectSheetShortcut()

  const availableModeIds = useAvailableConnectModes()
  const { connectSheetSource, setConnectSheetSource } = useAppStateSnapshot()
  const { state, activeFields, resolvedSteps, schema, getFieldOptions, setMode, updateField } =
    useConnectState()

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )
  // URL params have no defaults: a `null` value signals "not in URL" so we can
  // fall back to the user's last-used selections from localStorage.
  const { params, storedPrefs, setConnectParams, setQueryParams } = useConnectSheetParams()
  const {
    connectTab,
    framework: queryFramework,
    using: queryUsing,
    method: queryMethod,
    type: queryType,
    mcpClient: queryMcpClient,
  } = params

  useEffect(() => {
    const justOpened = showConnect && !prevShowConnect.current
    prevShowConnect.current = showConnect

    if (!justOpened) return

    track('connect_sheet_opened', { source: connectSheetSource })
    setConnectSheetSource('header_button')

    const effectiveTab = connectTab ?? storedPrefs.connectTab
    const effectiveFramework = queryFramework ?? storedPrefs.framework
    const effectiveUsing = queryUsing ?? storedPrefs.using
    const effectiveMethod = queryMethod ?? storedPrefs.method
    const effectiveType = queryType ?? storedPrefs.type
    const effectiveMcpClient = queryMcpClient ?? storedPrefs.mcpClient

    const mappedMode = mapConnectTabToMode(effectiveTab ?? null)
    if (mappedMode && availableModeIds.includes(mappedMode)) {
      setMode(mappedMode)
    }

    // Hydrate URL from storedPrefs so the URL reflects the restored state.
    // Only write params relevant to the active mode (matches how
    // handleModeChange/handleFieldChange manage URL params).
    const urlUpdates: Parameters<typeof setConnectParams>[0] = {}
    if (connectTab === null && effectiveTab) urlUpdates.connectTab = effectiveTab
    if (mappedMode === 'framework') {
      if (effectiveFramework) {
        updateField('framework', effectiveFramework)
        if (queryFramework === null) urlUpdates.framework = effectiveFramework
        if (effectiveUsing) {
          updateField('frameworkVariant', effectiveUsing)
          if (queryUsing === null) urlUpdates.using = effectiveUsing
        }
      }
    } else if (mappedMode === 'orm') {
      if (effectiveFramework) {
        updateField('orm', effectiveFramework)
        if (queryFramework === null) urlUpdates.framework = effectiveFramework
      }
    } else if (mappedMode === 'direct') {
      if (effectiveMethod) {
        updateField('connectionMethod', effectiveMethod)
        if (queryMethod === null) urlUpdates.method = effectiveMethod
      }
      if (effectiveType) {
        updateField('connectionType', effectiveType)
        if (queryType === null) urlUpdates.type = effectiveType
      }
    } else if (mappedMode === 'mcp') {
      if (effectiveMcpClient) {
        updateField('mcpClient', effectiveMcpClient)
        if (queryMcpClient === null) urlUpdates.mcpClient = effectiveMcpClient
      }
    }
    if (Object.keys(urlUpdates).length > 0) setQueryParams(urlUpdates)
  }, [
    showConnect,
    connectSheetSource,
    connectTab,
    queryFramework,
    queryUsing,
    queryMethod,
    queryType,
    queryMcpClient,
    storedPrefs,
    availableModeIds,
    track,
    setConnectSheetSource,
    setMode,
    updateField,
    setQueryParams,
  ])

  const clearAllQueryParams = () => {
    setQueryParams({
      connectTab: null,
      framework: null,
      using: null,
      method: null,
      type: null,
      mcpClient: null,
    })
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
  const { data: apiKeysData } = useAPIKeys({ projectRef }, { enabled: canReadAPIKeys })

  const projectKeys: ProjectKeys = useMemo(() => {
    const { anonKey, publishableKey } = apiKeysData ?? {}
    return {
      apiUrl: endpoint,
      anonKey: anonKey?.api_key ?? null,
      publishableKey: publishableKey?.api_key ?? null,
    }
  }, [endpoint, apiKeysData])

  const availableModes = useMemo(
    () => schema.modes.filter((m) => availableModeIds.includes(m.id)),
    [schema.modes, availableModeIds]
  )

  const handleModeChange = (mode: ConnectMode) => {
    setMode(mode)
    setConnectParams({
      connectTab: mode,
      framework: null,
      using: null,
      method: null,
      type: null,
      mcpClient: null,
    })
  }

  const handleFieldChange = (fieldId: string, value: string | boolean | string[]) => {
    updateField(fieldId, value)
    const str = String(value)
    if (fieldId === 'framework') {
      setConnectParams({ framework: str, using: null })
    } else if (fieldId === 'frameworkVariant') {
      setConnectParams({ using: str })
    } else if (fieldId === 'orm') {
      setConnectParams({ framework: str })
    } else if (fieldId === 'connectionMethod') {
      setConnectParams({ method: str, type: null })
    } else if (fieldId === 'connectionType') {
      setConnectParams({ type: str })
    } else if (fieldId === 'mcpClient') {
      setConnectParams({ mcpClient: str })
    }
  }

  return (
    <Sheet open={showConnect} onOpenChange={handleOpenChange}>
      <SheetContent
        className="flex flex-col gap-0 p-0 space-y-0 w-[700px]! sm:w-[540px]"
        tabIndex={undefined}
      >
        <SheetHeader>
          <SheetTitle>Connect to your project</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto divide-y">
          <div className="p-8">
            <ModeSelector
              modes={availableModes}
              selected={state.mode}
              onChange={handleModeChange}
            />
          </div>

          {activeFields.length > 0 && (
            <div className="border-b p-8">
              <ConnectConfigSection
                state={state}
                activeFields={activeFields}
                onFieldChange={handleFieldChange}
                getFieldOptions={getFieldOptions}
              />
            </div>
          )}

          {state.mode === 'catalog' ? (
            <WarehouseCatalogPanel
              queryEngine={(state.queryEngine as WarehouseCatalogEngine | undefined) ?? 'env'}
            />
          ) : (
            <ConnectStepsSection steps={resolvedSteps} state={state} projectKeys={projectKeys} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
