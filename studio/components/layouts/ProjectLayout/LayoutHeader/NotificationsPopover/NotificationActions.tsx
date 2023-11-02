import { Action, ActionReason, ActionType } from '@supabase/shared-types/out/notifications'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment } from 'react'
import { Button, IconExternalLink } from 'ui'

import { Organization, Project } from 'types'

interface NotificationActionsProps {
  project: Project
  organization: Organization
  changelogLink?: string
  availableActions: Action[]
  onSelectRestartProject: () => void
  onSelectApplyMigration: () => void
  onSelectRollbackMigration: () => void
}

const NotificationActions = ({
  project,
  organization,
  changelogLink,
  availableActions,
  onSelectRestartProject,
  onSelectApplyMigration,
  onSelectRollbackMigration,
}: NotificationActionsProps) => {
  const router = useRouter()

  const onSelectUpgradePlan = () => {
    return router.push(`/org/${organization.slug}/billing?panel=subscriptionPlan`)
  }

  const renderActionButton = (action: Action) => {
    switch (action.action_type) {
      case ActionType.UpgradeProjectToPro:
        return (
          <Button type="default" onClick={onSelectUpgradePlan}>
            Upgrade plan
          </Button>
        )
      case ActionType.SchedulePostgresRestart:
        return (
          <Button type="default" onClick={onSelectRestartProject}>
            Restart project
          </Button>
        )
      case ActionType.MigratePostgresSchema:
        if (action.reason === ActionReason.Rollback) {
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
        <Button asChild type="default" icon={<IconExternalLink size={12} strokeWidth={2} />}>
          <Link href={changelogLink} target="_blank" rel="noreferrer">
            More info
          </Link>
        </Button>
      )}
    </div>
  )
}

export default NotificationActions
