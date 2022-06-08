import { FC } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@supabase/ui'

import { Project } from 'types'

interface Props {
  project: Project
  availableActions: any[]
  onSelectRestartProject: () => void
}

const NotificationActions: FC<Props> = ({ project, availableActions, onSelectRestartProject }) => {
  const router = useRouter()

  const onSelectUpgradeProject = () => {
    return router.push(`/project/${project.ref}/settings/billing/update/pro`)
  }

  return (
    <div className="space-y-2">
      {availableActions.map((action: any) => {
        if (action.action_type === 'project.upgrade') {
          return (
            <Button key={action.action_type} type="default" onClick={onSelectUpgradeProject}>
              Upgrade project
            </Button>
          )
        } else if (action.action_type === 'postgresql.restart') {
          return (
            <Button key={action.action_type} type="default" onClick={onSelectRestartProject}>
              Restart project
            </Button>
          )
        }
      })}
    </div>
  )
}

export default NotificationActions
