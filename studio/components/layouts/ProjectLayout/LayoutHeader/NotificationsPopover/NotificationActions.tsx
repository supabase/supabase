import { FC, Fragment } from 'react'
import { useRouter } from 'next/router'
import { Button, IconExternalLink } from 'ui'
import { Action, ActionReason, ActionType } from '@supabase/shared-types/out/notifications'

import { Project } from 'types'
import Link from 'next/link'

// [Joshen TODO] Remove all things about "ownerReassignStatus" after 5th November
// double check with Qiao before we remove them.

interface Props {
  project: Project
  changelogLink?: string
  ownerReassignStatus?: any
  availableActions: Action[]
  onSelectRestartProject: () => void
  onSelectApplyMigration: () => void
  onSelectRollbackMigration: () => void
  onSelectFinalizeMigration: () => void
}

const NotificationActions: FC<Props> = ({
  project,
  changelogLink,
  ownerReassignStatus,
  availableActions,
  onSelectRestartProject,
  onSelectApplyMigration,
  onSelectRollbackMigration,
  onSelectFinalizeMigration,
}) => {
  const router = useRouter()

  const onSelectUpgradeProject = () => {
    return router.push(`/project/${project.ref}/settings/billing/update/pro`)
  }

  const renderActionButton = (action: Action) => {
    switch (action.action_type) {
      case ActionType.UpgradeProjectToPro:
        return (
          <Button type="default" onClick={onSelectUpgradeProject}>
            Upgrade project
          </Button>
        )
      case ActionType.SchedulePostgresRestart:
        return (
          <Button type="default" onClick={onSelectRestartProject}>
            Restart project
          </Button>
        )
      case ActionType.MigratePostgresSchema:
        if (action.reason === ActionReason.Finalize) {
          return (
            ownerReassignStatus?.desired !== 'migrated' && (
              <Button type="default" onClick={onSelectFinalizeMigration}>
                Finalize
              </Button>
            )
          )
        } else if (action.reason === ActionReason.Rollback) {
          return (
            ownerReassignStatus?.desired === 'temp_role' && (
              <Button type="default" onClick={onSelectRollbackMigration}>
                Rollback
              </Button>
            )
          )
        } else {
          return (
            ownerReassignStatus?.desired === 'unmigrated' && (
              <Button type="default" onClick={onSelectApplyMigration}>
                Apply now
              </Button>
            )
          )
        }
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {availableActions.map((action) => {
        return (
          <Fragment key={`${action.action_type}_${action.reason}`}>
            {renderActionButton(action)}
          </Fragment>
        )
      })}
      {changelogLink && (
        <Link href={changelogLink}>
          <a target="_blank" rel="noreferrer">
            <Button as="span" type="default" icon={<IconExternalLink size={12} strokeWidth={2} />}>
              More info
            </Button>
          </a>
        </Link>
      )}
    </div>
  )
}

export default NotificationActions
