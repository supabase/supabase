import { useFlag } from 'common'
import { ChevronDownIcon, RefreshCwIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SplitButtonGroup,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useSetProjectStatus } from '@/data/projects/project-detail-query'
import { useProjectRestartMutation } from '@/data/projects/project-restart-mutation'
import { useProjectRestartServicesMutation } from '@/data/projects/project-restart-services-mutation'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useIsProjectActive, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

export const RestartServerButton = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const isProjectActive = useIsProjectActive()

  const isBranch = Boolean(project?.parent_project_ref)
  const entityLabel = isBranch ? 'branch' : 'project'
  const entityLabelCapitalized = entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)
  const canRestart = isProjectActive || project?.status === PROJECT_STATUS.ACTIVE_UNHEALTHY
  const { setProjectStatus } = useSetProjectStatus()

  const [serviceToRestart, setServiceToRestart] = useState<'project' | 'branch' | 'database'>()

  const { projectSettingsRestartProject } = useIsFeatureEnabled([
    'project_settings:restart_project',
  ])

  const projectRef = project?.ref ?? ''
  const projectRegion = project?.region ?? ''

  const projectRestartDisabled = useFlag('disableProjectRestarts')
  const { can: canRestartProject } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.OPERATIONS_WRITE
  )

  const { mutate: restartProject, isPending: isRestartingProject } = useProjectRestartMutation({
    onSuccess: () => {
      onRestartSuccess()
    },
    onError: (error) => {
      onRestartFailed(error, 'project')
    },
  })
  const { mutate: restartProjectServices, isPending: isRestartingServices } =
    useProjectRestartServicesMutation({
      onSuccess: () => {
        onRestartSuccess()
      },
      onError: (error) => {
        onRestartFailed(error, 'database')
      },
    })

  const isLoading = isRestartingProject || isRestartingServices
  const hasRestartDropdown = canRestartProject && canRestart && !projectRestartDisabled

  const requestProjectRestart = () => {
    if (!canRestartProject) {
      return toast.error('You do not have the required permissions to restart this project')
    }
    restartProject({ ref: projectRef })
  }

  const requestDatabaseRestart = () => {
    if (!canRestartProject) {
      return toast.error('You do not have the required permissions to restart this project')
    }
    restartProjectServices({ ref: projectRef, region: projectRegion, services: ['postgresql'] })
  }

  const onRestartFailed = (error: StudioError, type: string) => {
    toast.error(`Unable to restart ${type}: ${error.message}`)
    setServiceToRestart(undefined)
  }

  const onRestartSuccess = () => {
    setProjectStatus({ ref: projectRef, status: PROJECT_STATUS.RESTARTING })
    toast.success('Restarting server...')
    router.push(`/project/${projectRef}`)
    setServiceToRestart(undefined)
  }

  return (
    <>
      {projectSettingsRestartProject ? (
        <SplitButtonGroup className="w-full @lg:w-auto">
          <ButtonTooltip
            type="button"
            className="flex-1 px-3 @lg:flex-none"
            disabled={
              project === undefined || !canRestartProject || !canRestart || projectRestartDisabled
            }
            onClick={() => setServiceToRestart(entityLabel)}
            tooltip={{
              content: {
                side: 'bottom',
                text: projectRestartDisabled
                  ? `${entityLabelCapitalized} restart is currently disabled`
                  : !canRestartProject
                    ? `You need additional permissions to restart this ${entityLabel}`
                    : !canRestart
                      ? `Unable to restart ${entityLabel} as ${entityLabel} is not active`
                      : undefined,
              },
            }}
          >
            Restart {entityLabel}
          </ButtonTooltip>
          {hasRestartDropdown && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  aria-label="Choose restart type"
                  className="shrink-0 px-1 py-1.25"
                  icon={<ChevronDownIcon />}
                  disabled={!canRestartProject}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem
                  key="database"
                  disabled={isLoading}
                  onClick={() => {
                    setServiceToRestart('database')
                  }}
                >
                  <div className="space-y-0.5">
                    <p className="block text-foreground">Fast database reboot</p>
                    <p className="block text-foreground-lighter">
                      Restarts only the database service, with less downtime than a full project
                      restart. Other project services remain running.
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SplitButtonGroup>
      ) : (
        <Button
          icon={<RefreshCwIcon />}
          className="w-full @lg:w-auto"
          disabled={isLoading}
          onClick={() => {
            setServiceToRestart('database')
          }}
        >
          Restart database
        </Button>
      )}

      <ConfirmationModal
        visible={serviceToRestart !== undefined}
        variant="destructive"
        title={`Restart ${serviceToRestart}`}
        description={
          <>
            Are you sure you want to restart your {serviceToRestart}? There will be a few minutes of
            downtime.
          </>
        }
        confirmLabel="Restart"
        confirmLabelLoading="Restarting"
        loading={isLoading}
        onCancel={() => setServiceToRestart(undefined)}
        onConfirm={() => {
          if (serviceToRestart === 'project' || serviceToRestart === 'branch') {
            requestProjectRestart()
          } else if (serviceToRestart === 'database') {
            requestDatabaseRestart()
          }
        }}
      />
    </>
  )
}
