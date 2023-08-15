import { Action, ActionReason, ActionType } from '@supabase/shared-types/out/notifications'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment } from 'react'
import { Button, IconExternalLink } from 'ui'

import { Project } from 'types'

interface NotificationActionsProps {
  project: Project
  changelogLink?: string
  availableActions: Action[]
  onSelectRestartProject: () => void
  onSelectApplyMigration: () => void
  onSelectRollbackMigration: () => void
  onSelectFinalizeMigration: () => void
}

const NotificationActions = ({
  project,
  changelogLink,
  availableActions,
  onSelectRestartProject,
  onSelectApplyMigration,
  onSelectRollbackMigration,
  onSelectFinalizeMigration,
}: NotificationActionsProps) => {
  const router = useRouter()

  const onSelectUpgradeProject = () => {
    return router.push(
      `/project/${project.ref}/settings/billing/subscription?panel=subscriptionPlan`
    )
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
            <Button type="default" onClick={onSelectFinalizeMigration}>
              Finalize
            </Button>
          )
        } else if (action.reason === ActionReason.Rollback) {
          return (
            <Button type="default" onClick={onSelectRollbackMigration}>
              Rollback
            </Button>
          )
        } else {
          return (
            <Button type="default" onClick={onSelectApplyMigration}>
              Apply now
            </Button>
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
        <Link href={changelogLink} passHref>
          <Button asChild type="default" icon={<IconExternalLink size={12} strokeWidth={2} />}>
            <a target="_blank" rel="noreferrer">
              More info
            </a>
          </Button>
        </Link>
      )}
    </div>
  )
}

export default NotificationActions
