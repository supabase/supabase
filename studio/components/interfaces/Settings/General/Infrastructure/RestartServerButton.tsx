import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
} from 'ui'

import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { useProjectRestartMutation } from 'data/projects/project-restart-mutation'
import { useProjectRestartServicesMutation } from 'data/projects/project-restart-services-mutation'
import { setProjectPostgrestStatus } from 'data/projects/projects-query'
import { useCheckPermissions, useStore } from 'hooks'

const RestartServerButton = () => {
  const { ui } = useStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const isProjectActive = useIsProjectActive()
  const [serviceToRestart, setServiceToRestart] = useState<'project' | 'database'>()

  const projectRef = project?.ref ?? ''
  const projectRegion = project?.region ?? ''

  const canRestartProject = useCheckPermissions(PermissionAction.INFRA_EXECUTE, 'reboot')

  const { mutate: restartProject, isLoading: isRestartingProject } = useProjectRestartMutation({
    onSuccess: () => {
      onRestartSuccess()
    },
    onError: (error) => {
      onRestartFailed(error, 'project')
    },
  })
  const { mutate: restartProjectServices, isLoading: isRestartingServices } =
    useProjectRestartServicesMutation({
      onSuccess: () => {
        onRestartSuccess()
      },
      onError: (error) => {
        onRestartFailed(error, 'database')
      },
    })

  const isLoading = isRestartingProject || isRestartingServices

  const requestProjectRestart = () => {
    if (!canRestartProject) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to restart this project',
      })
    }
    restartProject({ ref: projectRef })
  }

  const requestDatabaseRestart = async () => {
    if (!canRestartProject) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to restart this project',
      })
    }
    restartProjectServices({ ref: projectRef, region: projectRegion, services: ['postgresql'] })
  }

  const onRestartFailed = (error: any, type: string) => {
    ui.setNotification({
      error,
      category: 'error',
      message: `Unable to restart ${type}: ${error.message}`,
    })
    setServiceToRestart(undefined)
  }

  const onRestartSuccess = () => {
    setProjectPostgrestStatus(queryClient, projectRef, 'OFFLINE')
    ui.setNotification({ category: 'success', message: 'Restarting server...' })
    router.push(`/project/${projectRef}`)
    setServiceToRestart(undefined)
  }

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <div className="flex items-center">
            <Button
              type="default"
              className={`px-3 ${canRestartProject && isProjectActive ? 'rounded-r-none' : ''}`}
              disabled={project === undefined || !canRestartProject || !isProjectActive}
              onClick={() => setServiceToRestart('project')}
            >
              Restart project
            </Button>
            {canRestartProject && isProjectActive && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="default"
                    className="rounded-l-none px-[4px] py-[5px]"
                    icon={<IconChevronDown />}
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
                    <div className="space-y-1">
                      <p className="block text-foreground">Fast database reboot</p>
                      <p className="block text-foreground-light">
                        Restarts only the database - faster but may not be able to recover from all
                        failure modes
                      </p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </Tooltip.Trigger>
        {project !== undefined && (!canRestartProject || !isProjectActive) && (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                  'border border-background', //border
                ].join(' ')}
              >
                <span className="text-xs text-foreground">
                  {!canRestartProject
                    ? 'You need additional permissions to restart this project'
                    : !isProjectActive
                    ? 'Unable to restart project as project is not active'
                    : ''}
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
      <ConfirmModal
        danger
        visible={serviceToRestart !== undefined}
        title={`Restart ${serviceToRestart}`}
        // @ts-ignore
        description={
          <>
            Are you sure you want to restart the{' '}
            <span className="text-foreground">{serviceToRestart}</span>? There will be a few minutes
            of downtime.
          </>
        }
        buttonLabel="Restart"
        buttonLoadingLabel="Restarting"
        onSelectCancel={() => setServiceToRestart(undefined)}
        onSelectConfirm={async () => {
          if (serviceToRestart === 'project') {
            await requestProjectRestart()
          } else if (serviceToRestart === 'database') {
            await requestDatabaseRestart()
          }
        }}
      />
    </>
  )
}

export default observer(RestartServerButton)
