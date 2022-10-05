import { Project } from 'types'
import {
  Action,
  ActionType,
  ExtensionsUpgrade,
  Notification,
  NotificationName,
  ServerUpgrade,
  ServiceUpgrade,
  ViolatedLimit,
} from '@supabase/shared-types/out/notifications'
import { IconArrowRight, IconExternalLink } from '@supabase/ui'
import Link from 'next/link'

export const formatNotificationText = (project: Project, notification: Notification) => {
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
    }
  } else if (notification.data.name === NotificationName.ProjectUpdateCompleted) {
    const { upgrades } = notification.data
    const upgradesText = upgrades
      .map(
        (upgrade: ServiceUpgrade) =>
          `${upgrade.name}: ${upgrade.version_to} ${upgrade.changelog_link}`
      )
      .reduce((a: string, b: string) => `${a}\n${b}`)
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
                      <a>
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
    return notification.data.message
  } else {
    return (
      <p className="text-sm">
        Unknown notification type: {notification.notification_name} - Please reach out to support
        for more information.
      </p>
    )
  }
}

export const formatNotificationCTAText = (availableActions: Action[]) => {
  const [action] = availableActions
  if (!action) return ''

  switch (action.action_type) {
    case ActionType.SchedulePostgresRestart:
      return 'Restart your project to get the latest updates.'
    case ActionType.UpgradeProjectToPro:
      return 'Upgrade your project to ensure continued availability.'
    case ActionType.PgBouncerRestart:
      return 'Restart your connection pooler to get the latest updates.'
    default:
      return ''
  }
}
