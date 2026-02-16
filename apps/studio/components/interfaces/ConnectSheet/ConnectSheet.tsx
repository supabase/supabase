import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import { cn, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'

import type { ProjectKeys } from './Connect.types'
import { ConnectConfigSection, ModeSelector } from './ConnectConfigSection'
import { ConnectStepsSection } from './ConnectStepsSection'
import { useConnectState } from './useConnectState'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const ConnectSheet = () => {
  const {
    projectConnectionShowAppFrameworks: showAppFrameworks,
    projectConnectionShowMobileFrameworks: showMobileFrameworks,
    projectConnectionShowOrms: showOrms,
  } = useIsFeatureEnabled([
    'project_connection:show_app_frameworks',
    'project_connection:show_mobile_frameworks',
    'project_connection:show_orms',
  ])

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )
  const [, setConnectTab] = useQueryState('connectTab', parseAsString)

  const handleOpenChange = (sheetOpen: boolean) => {
    if (!sheetOpen) {
      setConnectTab(null)
    }
    setShowConnect(sheetOpen)
  }

  const { state, activeFields, resolvedSteps, schema, getFieldOptions, setMode, updateField } =
    useConnectState()

  // Project keys for step components
  const { ref: projectRef } = useParams()
  const { data: settings } = useProjectSettingsV2Query({ projectRef }, { enabled: showConnect })
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )
  const { data: apiKeys } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })
  const { anonKey, publishableKey } = canReadAPIKeys
    ? getKeys(apiKeys)
    : { anonKey: null, publishableKey: null }

  const projectKeys: ProjectKeys = useMemo(() => {
    const protocol = settings?.app_config?.protocol ?? 'https'
    const endpoint = settings?.app_config?.endpoint ?? ''
    const apiHost = canReadAPIKeys ? `${protocol}://${endpoint ?? '-'}` : ''

    return {
      apiUrl: apiHost ?? null,
      anonKey: anonKey?.api_key ?? null,
      publishableKey: publishableKey?.api_key ?? null,
    }
  }, [
    settings?.app_config?.protocol,
    settings?.app_config?.endpoint,
    canReadAPIKeys,
    anonKey?.api_key,
    publishableKey?.api_key,
  ])

  const availableModeIds = useMemo(() => {
    const modes: string[] = []
    const showFrameworks = showAppFrameworks || showMobileFrameworks

    if (showFrameworks) modes.push('framework')
    modes.push('direct')
    if (showOrms) modes.push('orm')
    modes.push('mcp')

    return modes
  }, [showAppFrameworks, showMobileFrameworks, showOrms])

  const availableModes = useMemo(
    () => schema.modes.filter((m) => availableModeIds.includes(m.id)),
    [schema.modes, availableModeIds]
  )

  return (
    <Sheet open={showConnect} onOpenChange={handleOpenChange}>
      <SheetContent size="lg" className="flex flex-col gap-0 p-0 space-y-0" tabIndex={undefined}>
        <SheetHeader className={cn('text-left border-b shrink-0 py-6 px-8')}>
          <SheetTitle>Connect to your project</SheetTitle>
          <SheetDescription>Choose how you want to use Supabase</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto divide-y">
          <div className="p-8">
            <ModeSelector modes={availableModes} selected={state.mode} onChange={setMode} />
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
