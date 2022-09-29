import { FC } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@supabase/ui'
import { Action, ActionType } from '@supabase/shared-types/out/notifications'

import { Project } from 'types'
import { API_URL } from 'lib/constants'
import { post, delete_ } from 'lib/common/fetch'

interface Props {
  project: Project
  availableActions: Action[]
  onSelectRestartProject: () => void
}

const NotificationActions: FC<Props> = ({ project, availableActions, onSelectRestartProject }) => {
  const router = useRouter()

  const onSelectUpgradeProject = () => {
    return router.push(`/project/${project.ref}/settings/billing/update/pro`)
  }

  // TODO: allow configuring other routes
  const onSelectMigrateProject = () => {
    post(`${API_URL}/platform/database/${project.ref}/owner-reassign`, {})
      .then((resp) => console.info(resp))
      .catch((err) => console.info(err))
  }
  const onSelectRollbackProject = () => {
    delete_(`${API_URL}/platform/database/${project.ref}/owner-reassign`, {})
      .then((resp) => console.info(resp))
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
          return (
            <>
              <Button key={action.action_type} type="default" onClick={onSelectMigrateProject}>
                Apply now
              </Button>
              <Button key={action.action_type} type="default" onClick={onSelectRollbackProject}>
                Rollback
              </Button>
            </>
          )
        }
      })}
    </div>
  )
}

export default NotificationActions
