import dayjs from 'dayjs'
import { FC } from 'react'
import {
  Button,
  Dropdown,
  IconCheck,
  IconMoreVertical,
  IconRefreshCw,
  IconXSquare,
} from '@supabase/ui'
import { Notification } from '@supabase/shared-types/out/notifications'

import { useStore } from 'hooks'
import { Project } from 'types'

interface Props {
  notification: Notification
}

const DIMENSION: any = {
  db_storage: 'storage',
}

const TierLimitExceededNotification: FC<Props> = ({ notification }) => {
  const { app } = useStore()
  const [project] = app.projects.list((project: Project) => project.id === notification.project_id)

  const { dimension, first_violated_at } = notification.data
  const projectName = project?.name ?? 'Unknown'
  const insertedAt = dayjs(notification.inserted_at).format('DD MMM YYYY, HH:mma')
  const firstViolatedAt = dayjs(first_violated_at).format('DD MMM YYYY')

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="space-y-1">
        <p className="text-sm">
          Your project {projectName} has exceeded it's {DIMENSION[dimension]} limit since{' '}
          {firstViolatedAt}. <span className="text-brand-900 cursor-pointer">Upgrade</span> your
          project to ensure its continued availability.
        </p>
        <p className="text-scale-1000 text-sm">{insertedAt}</p>
      </div>
    </div>
  )
}

export default TierLimitExceededNotification
