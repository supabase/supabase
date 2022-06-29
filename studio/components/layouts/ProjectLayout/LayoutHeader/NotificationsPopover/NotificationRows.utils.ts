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

export const formatNotificationText = (project: Project, notification: Notification) => {
  const projectName = project.name

  if (notification.data.name === NotificationName.ProjectExceedingTierLimit) {
    const { violations } = notification.data
    const violationsText = violations
      .map((violation: ViolatedLimit) => violation.dimension as string)
      .reduce((a: string, b: string) => `${a}, ${b}`)

    return `Your project "${projectName}" has exceeded its limits in the following areas: ${violationsText}.`
  } else if (notification.data.name === NotificationName.PostgresqlUpgradeAvailable) {
    const { upgrade_type, additional } = notification.data

    if (upgrade_type === 'postgresql-server') {
      const { version_to } = additional as ServerUpgrade
      return `New version of Postgres (${version_to}) is now available for project "${projectName}".`
    } else if (upgrade_type === 'extensions') {
      const { name, version_to } = additional as ExtensionsUpgrade
      return `New version of "${name}" (${version_to}) is now available for project "${projectName}".`
    }
    return ''
  } else if (notification.data.name === NotificationName.PostgresqlUpgradeCompleted) {
    const { upgrade_type, additional } = notification.data

    if (upgrade_type === 'postgresql-server') {
      const { version_to } = additional as ServerUpgrade
      return `Postgres (${version_to}) has been successfully updated to ${version_to} for project "${projectName}".`
    } else if (upgrade_type === 'extensions') {
      const { name, version_to } = additional as ExtensionsUpgrade
      return `The extension "${name}" has been successfully updated to ${version_to} for project "${projectName}".`
    }
  } else if (notification.data.name === NotificationName.ProjectUpdateCompleted) {
    const { upgrades } = notification.data
    const upgradesText = upgrades
      .map((upgrade: ServiceUpgrade) => upgrade.name)
      .reduce((a: string, b: string) => `${a}, ${b}`)
    return `The following services have been successfully updated for project "${projectName}": ${upgradesText}.`
  } else if (notification.data.name === NotificationName.ProjectInformational) {
    return notification.data.message
  } else {
    return `Unknown notification type: ${notification.notification_name} - Please reach out to support for more information.`
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
