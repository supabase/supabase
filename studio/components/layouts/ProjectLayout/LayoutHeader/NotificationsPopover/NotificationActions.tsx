import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@supabase/ui'
import { Action, ActionType } from '@supabase/shared-types/out/notifications'

import { Project } from 'types'
import { API_URL } from 'lib/constants'
import { post, delete_, patch } from 'lib/common/fetch'
import { useStore } from 'hooks/misc/useStore'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

interface Props {
  project: Project
  availableActions: Action[]
  onSelectRestartProject: () => void
}

const NotificationActions: FC<Props> = ({ project, availableActions, onSelectRestartProject }) => {
  const router = useRouter()
  const { app } = useStore()
  const [showModal, setShowModal] = useState<boolean>(false)

  const onSelectUpgradeProject = () => {
    return router.push(`/project/${project.ref}/settings/billing/update/pro`)
  }

  // TODO: allow configuring other routes
  const onSelectMigrateProject = () => {
    post(`${API_URL}/platform/database/${project.ref}/owner-reassign`, {})
      // Refresh database connection string
      .then((_) => app.projects.fetchDetail(project.ref))
      .catch((err) => console.info(err))
  }
  const onSelectRollbackProject = () => {
    delete_(`${API_URL}/platform/database/${project.ref}/owner-reassign`, {})
      // Refresh database connection string
      .then((_) => app.projects.fetchDetail(project.ref))
      .catch((err) => console.info(err))
  }
  const onSelectFinalizeProject = () => {
    patch(`${API_URL}/platform/database/${project.ref}/owner-reassign`, {})
      // Refresh database connection string
      .then((_) => app.projects.fetchDetail(project.ref))
      .catch((err) => console.info(err))
  }

  return (
    <div className="space-y-2">
      {availableActions.map((action) => {
        if (action.action_type === ActionType.UpgradeProjectToPro) {
          return (
            <Button key={action.action_type} type="default" onClick={onSelectUpgradeProject}>
              Upgrade project
            </Button>
          )
        } else if (action.action_type === ActionType.SchedulePostgresRestart) {
          return (
            <Button key={action.action_type} type="default" onClick={onSelectRestartProject}>
              Restart project
            </Button>
          )
        } else if (action.action_type === ActionType.MigratePostgresSchema) {
          if (action.reason === 'finalize') {
            return (
              <Button
                key={`${action.action_type}_${action.reason}`}
                type="default"
                onClick={() => setShowModal(true)}
              >
                Finalize
              </Button>
            )
          }
          if (action.reason === 'rollback') {
            return (
              <Button
                key={`${action.action_type}_${action.reason}`}
                type="default"
                onClick={onSelectRollbackProject}
              >
                Rollback
              </Button>
            )
          }
          return (
            <Button key={action.action_type} type="default" onClick={onSelectMigrateProject}>
              Apply now
            </Button>
          )
        }
      })}
      <ConfirmModal
        danger
        visible={showModal}
        title={`Schema migration for "${project.name}"`}
        description={`Are you sure you want to finalize the current schema migration? This action is irreversible.`}
        buttonLabel="Finalize"
        buttonLoadingLabel="Finalizing"
        onSelectCancel={() => setShowModal(false)}
        onSelectConfirm={onSelectFinalizeProject}
      />
    </div>
  )
}

export default NotificationActions
