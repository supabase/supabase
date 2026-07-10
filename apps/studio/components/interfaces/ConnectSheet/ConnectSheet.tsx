import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef } from 'react'
import { cn, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'

import type { ConnectMode, ProjectKeys } from './Connect.types'
import { ConnectConfigSection, ModeSelector } from './ConnectConfigSection'
import { resolveConnectSheetHydration } from './ConnectSheet.utils'
import { ConnectStepsSection } from './ConnectStepsSection'
import { useAvailableConnectModes } from './useAvailableConnectModes'
import { useConnectSheetParams } from './useConnectSheetParams'
import { useConnectSheetShortcut } from './useConnectSheetShortcut'
import { useConnectState } from './useConnectState'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

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

    const { mode, fieldUpdates, urlUpdates } = resolveConnectSheetHydration(
      {
        connectTab,
        framework: queryFramework,
        using: queryUsing,
        method: queryMethod,
        type: queryType,
        mcpClient: queryMcpClient,
      },
      storedPrefs,
      availableModeIds
    )

    if (mode) setMode(mode)
    fieldUpdates.forEach(({ fieldId, value }) => updateField(fieldId, value))
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

          <ConnectStepsSection steps={resolvedSteps} state={state} projectKeys={projectKeys} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
