import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Button, Dropdown, IconChevronDown } from '@supabase/ui'

import { Project } from 'types'
import { useStore, checkPermissions } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

interface Props {
  project: Project
}

const RestartServerButton: FC<Props> = ({ project }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serviceToRestart, setServiceToRestart] = useState<'project' | 'database'>()

  const projectId = project.id
  const projectRef = project.ref
  const projectRegion = project.region

  const canRestartProject = checkPermissions(PermissionAction.INFRA_EXECUTE, 'reboot')

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
      message: `Unable to restart ${type}`,
    })
    setLoading(false)
    setServiceToRestart(undefined)
  }

  const onRestartSuccess = () => {
    app.onProjectPostgrestStatusUpdated(projectId, 'OFFLINE')
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
              className="rounded-r-none px-3"
              disabled={!canRestartProject}
              onClick={() => setServiceToRestart('project')}
            >
              Restart project
            </Button>
            {canRestartProject && (
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
                      <p className="text-scale-1200 block">Fast database reboot</p>
                      <p className="text-scale-1100 block">
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
        {!canRestartProject && (
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                'border-scale-200 border ', //border
              ].join(' ')}
            >
              <span className="text-scale-1200 text-xs">
                You need additional permissions to restart this project
              </span>
            </div>
          </Tooltip.Content>
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
