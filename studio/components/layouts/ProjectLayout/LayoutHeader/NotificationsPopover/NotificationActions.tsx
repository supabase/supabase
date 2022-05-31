import { FC } from 'react'
import { Button } from '@supabase/ui'

interface Props {
  availableActions: any[]
}

const NotificationActions: FC<Props> = ({ availableActions }) => {
  return (
    <div className="space-y-2">
      {availableActions.map((action: any) => {
        if (action.action_type === 'project.upgrade') {
          return (
            <Button key={action.action_type} type="default">
              Upgrade project
            </Button>
          )
        } else if (action.action_type === 'postgresql.restart') {
          return (
            <Button key={action.action_type} type="default">
              Restart project
            </Button>
          )
        }
      })}
    </div>
  )
}

export default NotificationActions
