import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Plug } from 'lucide-react'
import { ComponentProps, useMemo, useState } from 'react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn
} from 'ui'

import type { ProjectKeys } from './Connect.types'
import { ConnectConfigSection, ModeSelector } from './ConnectConfigSection'
import { ConnectStepsSection } from './ConnectStepsSection'
import { useConnectState } from './useConnectState'

interface ConnectSheetProps {
  buttonType?: ComponentProps<typeof Button>['type']
}

export const ConnectSheet = ({ buttonType = 'default' }: ConnectSheetProps) => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const {
    projectConnectionShowAppFrameworks: showAppFrameworks,
    projectConnectionShowMobileFrameworks: showMobileFrameworks,
    projectConnectionShowOrms: showOrms,
  } = useIsFeatureEnabled([
    'project_connection:show_app_frameworks',
    'project_connection:show_mobile_frameworks',
    'project_connection:show_orms',
  ])

  // Filter available modes based on feature flags
  const availableModeIds = useMemo(() => {
    const modes: string[] = []
    const showFrameworks = showAppFrameworks || showMobileFrameworks

    if (showFrameworks) modes.push('framework')
    modes.push('direct')
    if (showOrms) modes.push('orm')
    modes.push('mcp')

    return modes
  }, [showAppFrameworks, showMobileFrameworks, showOrms])

  const [showConnect, setShowConnect] = useState(false)

  const {
    state,
    updateField,
    setMode,
    activeFields,
    resolvedSteps,
    getFieldOptions,
    schema,
  } = useConnectState()

  // Filter modes based on feature flags
  const availableModes = useMemo(
    () => schema.modes.filter((m) => availableModeIds.includes(m.id)),
    [schema.modes, availableModeIds]
  )

  // Project keys for step components
  const { ref: projectRef } = useParams()
  const { data: settings } = useProjectSettingsV2Query(
    { projectRef },
    { enabled: showConnect }
  )
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef },
    { enabled: canReadAPIKeys }
  )
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

  const handleSheetChange = (open: boolean) => {
    setShowConnect(open)
  }

  const handleSourceChange = (databaseId: string) => {
    // Database selection is handled by the DatabaseSelector's internal state
    // We just need to trigger a re-render of connection strings
  }

  if (!isActiveHealthy) {
    return (
      <ButtonTooltip
        disabled
        type="default"
        className="rounded-full"
        icon={<Plug className="rotate-90" />}
        tooltip={{
          content: {
            side: 'bottom',
            text: 'Project is currently not active and cannot be connected',
          },
        }}
      >
        Connect
      </ButtonTooltip>
    )
  }

  return (
    <Sheet open={showConnect} onOpenChange={handleSheetChange}>
      <SheetTrigger asChild>
        <Button type={buttonType} className="rounded-full" icon={<Plug className="rotate-90" />}>
          <span>Connect</span>
        </Button>
      </SheetTrigger>
      <SheetContent size="lg" className="flex flex-col gap-0 p-0 space-y-0" tabIndex={undefined}>
        <SheetHeader className={cn('text-left border-b shrink-0 py-6 px-8')}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <SheetTitle>Connect to your project</SheetTitle>
              <SheetDescription>Choose how you want to use Supabase</SheetDescription>
            </div>
            <div className="w-full lg:w-auto">
              <DatabaseSelector
                align="end"
                buttonProps={{
                  size: 'small',
                  className: 'w-full lg:w-auto justify-between pr-2.5 [&_svg]:h-4',
                }}
                className="w-full [&>span]:w-1/2 [&>span]:md:w-auto"
                onSelectId={handleSourceChange}
              />
            </div>
          </div>
        </SheetHeader>

          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Configuration Section */}
            <div className="space-y-6 border-b p-8 shrink-0">
              <ModeSelector
                modes={availableModes}
                selected={state.mode}
                onChange={setMode}
              />
            <div className="border-t pt-8">
              <ConnectConfigSection
                activeFields={activeFields}
                state={state}
                onFieldChange={updateField}
                getFieldOptions={getFieldOptions}
              />
              </div>
            </div>

            {/* Steps Section */}
            <ConnectStepsSection
              steps={resolvedSteps}
              state={state}
              projectKeys={projectKeys}
            />
          </div>
      </SheetContent>
    </Sheet>
  )
}
