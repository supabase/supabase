import dayjs from 'dayjs'
import { Project } from 'types'
import {
  Action,
  ActionReason,
  ActionType,
  ExtensionsUpgrade,
  Notification,
  NotificationName,
  ServerUpgrade,
  ServiceUpgrade,
  ViolatedLimit,
} from '@supabase/shared-types/out/notifications'
import { IconArrowRight, IconExternalLink } from 'ui'
import Link from 'next/link'

export const formatNotificationText = (
  project: Project,
  notification: Notification,
  ownerReassignStatus?: any
) => {
  const projectName = project.name

  if (notification.data.name === NotificationName.ProjectExceedingTierLimit) {
    const { violations } = notification.data
    const violationsText = violations
      .map((violation: ViolatedLimit) => violation.dimension as string)
      .reduce((a: string, b: string) => `${a}, ${b}`)

    return (
      <p className="text-sm">
        Your project "{projectName}" has exceeded its limits in the following areas:{' '}
        {violationsText}.
      </p>
    )
  } else if (notification.data.name === NotificationName.PostgresqlUpgradeAvailable) {
    const { upgrade_type, additional } = notification.data

    if (upgrade_type === 'postgresql-server') {
      const { version_to } = additional as ServerUpgrade
      return (
        <p className="text-sm">
          New version of Postgres ({version_to}) is now available for project "{projectName}".
        </p>
      )
    } else if (upgrade_type === 'extensions') {
      const { name, version_to } = additional as ExtensionsUpgrade
      return (
        <p className="text-sm">
          New version of "{name}" ({version_to}) is now available for project "{projectName}".
        </p>
      )
    } else if (upgrade_type === 'schema-migration') {
      const { name, version_to } = additional as ExtensionsUpgrade
      return (
        <div className="text-sm space-y-1">
          <p>A new schema migration is available for your project "{projectName}".</p>
          <ol className="list-disc pl-6">
            <li>
              <div className="flex items-center space-x-1">
                <p>{name}</p>
                <IconArrowRight size={12} strokeWidth={2} />
                <p>{version_to}</p>
              </div>
            </li>
          </ol>
        </div>
      )
    }
    return ''
  } else if (notification.data.name === NotificationName.PostgresqlUpgradeCompleted) {
    const { upgrade_type, additional } = notification.data

    if (upgrade_type === 'postgresql-server') {
      const { version_to } = additional as ServerUpgrade
      return (
        <p className="text-sm">
          Postgres ({version_to}) has been successfully updated to {version_to} for project "
          {projectName}".
        </p>
      )
    } else if (upgrade_type === 'extensions') {
      const { name, version_to } = additional as ExtensionsUpgrade
      return (
        <p className="text-sm">
          The extension "{name}" has been successfully updated to {version_to} for project "
          {projectName}".
        </p>
      )
    } else if (upgrade_type === 'schema-migration') {
      const { version_to } = additional
      if (ownerReassignStatus?.desired === 'unmigrated') {
        return (
          <p className="text-sm">
            The schema migration "{version_to}" will be applied for project "{projectName}" within a
            few days. You may opt to apply the changes now, or it'll be done so automatically.
          </p>
        )
      } else if (ownerReassignStatus?.desired === 'temp_role') {
        return (
          <p className="text-sm">
            The schema migration "{version_to}" will be finalized for project "{projectName}" within
            a few days. You may opt to finalize the changes now, or it'll be done so automatically.
          </p>
        )
      } else {
        return (
          <p className="text-sm">
            The schema migration "{version_to}" has been successfully applied for project "
            {projectName}".
          </p>
        )
      }
    }
  } else if (notification.data.name === NotificationName.ProjectUpdateCompleted) {
    const { upgrades } = notification.data
    return (
      <div>
        <p className="text-sm">
          The following services have been successfully updated for project "{projectName}":
        </p>
        <ol className="list-disc pl-6">
          {upgrades.map((upgrade: ServiceUpgrade) => (
            <li key={upgrade.name}>
              <div className="flex items-center space-x-1">
                <p className="text-sm">{upgrade.name}</p>
                <IconArrowRight size={12} strokeWidth={2} />
                <p className="text-sm">{upgrade.version_to}</p>
                {upgrade.changelog_link && (
                  <div className="!ml-4">
                    <Link href={upgrade.changelog_link}>
                      <a target="_blank" rel="noreferrer">
                        <IconExternalLink
                          className="cursor-pointer text-scale-1000 hover:text-scale-1200 transition"
                          size={12}
                          strokeWidth={2}
                        />
                      </a>
                    </Link>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    )
  } else if (notification.data.name === NotificationName.ProjectInformational) {
    return <p className="text-sm">{notification.data.message}</p>
  } else {
    return (
      <p className="text-sm">
        Unknown notification type: {notification.notification_name} - Please reach out to support
        for more information.
      </p>
    )
  }
}

export const formatNotificationCTAText = (
  availableActions: Action[],
  ownerReassignStatus?: any
) => {
  const [action] = availableActions
  if (!action) return <p className="text-sm"></p>

  switch (action.action_type) {
    case ActionType.SchedulePostgresRestart:
      return <p className="text-sm">Restart your project to get the latest updates.</p>
    case ActionType.UpgradeProjectToPro:
      return <p className="text-sm">Upgrade your project to ensure continued availability.</p>
    case ActionType.PgBouncerRestart:
      return <p className="text-sm">Restart your connection pooler to get the latest updates.</p>
    case ActionType.MigratePostgresSchema:
      if (action.deadline) {
        if (ownerReassignStatus?.desired === 'migrated') {
          return (
            <p className="text-sm space-x-1">
              This patch was applied on{' '}
              {dayjs(new Date(ownerReassignStatus.migrated_at ?? action.deadline)).format(
                'DD MMM YYYY, HH:mma'
              )}
            </p>
          )
        } else if (ownerReassignStatus?.desired === 'temp_role') {
          if (action.reason === ActionReason.Finalize) {
            return (
              <p className="text-sm space-x-1">
                This patch will be automatically applied after{' '}
                {dayjs(new Date(action.deadline)).format('DD MMM YYYY, HH:mma')}
              </p>
            )
          } else {
            return (
              <p className="text-sm space-x-1">
                This patch was applied on{' '}
                {dayjs(new Date(ownerReassignStatus.modified_at)).format('DD MMM YYYY, HH:mma')}
              </p>
            )
          }
        } else {
          return (
            <p className="text-sm space-x-1">
              This patch will be automatically applied after{' '}
              {dayjs(new Date(action.deadline)).format('DD MMM YYYY, HH:mma')}
            </p>
          )
        }
      } else {
        return ''
      }

    default:
      return ''
  }
}
