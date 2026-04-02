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

export const ConnectSheet = () => {
  const { ref: projectRef } = useParams()

  const availableModeIds = useAvailableConnectModes()

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )
  const [connectTab, setConnectTab] = useQueryState('connectTab', parseAsString)
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

    if (connectTab && isConnectMode(connectTab) && availableModeIds.includes(connectTab)) {
      setMode(connectTab)
    }
  }, [
    showConnect,
    connectSheetSource,
    connectTab,
    availableModeIds,
    track,
    setConnectSheetSource,
    setMode,
  ])

  const handleOpenChange = (sheetOpen: boolean) => {
    if (!sheetOpen) {
      setConnectTab(null)
    }
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
              onFieldChange={updateField}
              getFieldOptions={getFieldOptions}
            />
          </div>

          <ConnectStepsSection steps={resolvedSteps} state={state} projectKeys={projectKeys} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
