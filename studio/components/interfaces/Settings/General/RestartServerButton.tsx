import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, IconChevronDown, IconRefreshCcw } from '@supabase/ui'

import { Project } from 'types'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

interface Props {
  project: Project
}

const RestartServerButton: FC<Props> = observer(({ project }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serviceToRestart, setServiceToRestart] = useState<'project' | 'database'>()

  const projectId = project.id
  const projectRef = project.ref
  const projectRegion = project.region

  const requestProjectRestart = async () => {
    setLoading(true)
    const res = await post(`${API_URL}/projects/${projectRef}/restart`, {})
    if (res.error) onRestartFailed(res.error, 'project')
    else onRestartSuccess()
  }

  const requestDatabaseRestart = async () => {
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
      <ConfirmModal
        danger
        visible={serviceToRestart !== undefined}
        title="Restart Server"
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
      {/* <Button type="default" icon={<IconRefreshCcw />} onClick={openModal} loading={loading}>
        Restart server
      </Button> */}
      <Dropdown
        align="end"
        side="bottom"
        overlay={[
          <Dropdown.Item
            key="project"
            disabled={loading}
            onClick={() => {
              setServiceToRestart('project')
            }}
          >
            Restart project
          </Dropdown.Item>,
          <Dropdown.Item
            key="database"
            disabled={loading}
            onClick={() => {
              setServiceToRestart('database')
            }}
          >
            Restart database only
          </Dropdown.Item>,
        ]}
      >
        <Button type="default" iconRight={<IconChevronDown />}>
          Restart services
        </Button>
      </Dropdown>
    </>
  )
})

export default RestartServerButton
