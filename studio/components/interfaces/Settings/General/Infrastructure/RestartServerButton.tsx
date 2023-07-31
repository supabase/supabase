import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, Dropdown, IconChevronDown } from 'ui'

import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { setProjectPostgrestStatus } from 'data/projects/projects-query'
import { useCheckPermissions, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'

const RestartServerButton = () => {
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const { ui } = useStore()
  const router = useRouter()
  const isProjectActive = useIsProjectActive()
  const [loading, setLoading] = useState(false)
  const [serviceToRestart, setServiceToRestart] = useState<'project' | 'database'>()

  const projectRef = project?.ref ?? ''
  const projectRegion = project?.region

  const canRestartProject = useCheckPermissions(PermissionAction.INFRA_EXECUTE, 'reboot')

  const requestProjectRestart = async () => {
    if (!canRestartProject) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to restart this project',
      })
    }
    setLoading(true)
    const res = await post(`${API_URL}/projects/${projectRef}/restart`, {})
    if (res.error) onRestartFailed(res.error, 'project')
    else onRestartSuccess()
  }

  const requestDatabaseRestart = async () => {
    if (!canRestartProject) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to restart this project',
      })
    }
    setLoading(true)
    const res = await post(`${API_URL}/projects/${projectRef}/restart-services`, {
      restartRequest: {
        region: projectRegion,
        services: ['postgresql'],
      },
    })
    if (res.error) onRestartFailed(res.error, 'database')
    else onRestartSuccess()
  }

  const onRestartFailed = (error: any, type: string) => {
    ui.setNotification({
      error,
      category: 'error',
      message: `Unable to restart ${type}: ${error.message}`,
    })
    setLoading(false)
    setServiceToRestart(undefined)
  }

  const onRestartSuccess = () => {
    setProjectPostgrestStatus(queryClient, projectRef, 'OFFLINE')
    ui.setNotification({ category: 'success', message: 'Restarting server' })
    router.push(`/project/${projectRef}`)
    setLoading(false)
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
              disabled={!canRestartProject || !isProjectActive}
              onClick={() => setServiceToRestart('project')}
            >
              Restart project
            </Button>
            {canRestartProject && isProjectActive && (
              <Dropdown
                align="end"
                side="bottom"
                overlay={[
                  <Dropdown.Item
                    key="database"
                    disabled={loading}
                    onClick={() => {
                      setServiceToRestart('database')
                    }}
                  >
                    <div className="space-y-1">
                      <p className="block text-scale-1200">Fast database reboot</p>
                      <p className="block text-scale-1100 text-xs">
                        Restarts only the database - faster but may not be able to recover from all
                        failure modes
                      </p>
                    </div>
                  </Dropdown.Item>,
                ]}
              >
                <Button
                  type="default"
                  className="rounded-l-none px-[4px] py-[5px]"
                  icon={<IconChevronDown />}
                  disabled={!canRestartProject}
                />
              </Dropdown>
            )}
          </div>
        </Tooltip.Trigger>
        {(!canRestartProject || !isProjectActive) && (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                  'border border-scale-200 ', //border
                ].join(' ')}
              >
                <span className="text-xs text-scale-1200">
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
            <span className="text-scale-1200">{serviceToRestart}</span>? There will be a few minutes
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
