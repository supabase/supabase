import { Project } from 'types'
import {
  ExtensionsUpgrade,
  Notification,
  NotificationName,
  PostgresqlUpgradeData,
  ProjectExceedingTierLimitData,
  ProjectUpdateData,
  ServerUpgrade,
  ServiceUpgrade,
  ViolatedLimit,
} from '@supabase/shared-types/out/notifications'

// Switch to proper typing with NotificationName after PR is in
export const formatNotificationText = (project: Project, notification: Notification) => {
  const projectName = project.name
  const notificationName = notification.notification_name

  if (notificationName === NotificationName.ProjectExceedingTierLimit) {
    const { violations } = notification.data as ProjectExceedingTierLimitData
    const violationsText = violations
      .map((violation: ViolatedLimit) => violation.dimension as string)
      .reduce((a: string, b: string) => `${a}, ${b}`)

    return `Your project "${projectName}" has exceeded its limits in the following areas: ${violationsText}. Please upgrade your project to ensure continued availability.`
  } else if (notificationName === NotificationName.PostgresqlUpgradeAvailable) {
    const { upgrade_type, additional } = notification.data as PostgresqlUpgradeData

    if (upgrade_type === 'postgresql-server') {
      const { version_to } = additional as ServerUpgrade
      return `A new version of Postgres (${version_to}) is now available for project "${projectName}". You may restart your project to get this update.`
    } else if (upgrade_type === 'extensions') {
      const { name, version_to } = additional as ExtensionsUpgrade
      return `A new version of the extension "${name}" (${version_to}) is now available for project "${projectName}". You may restart your project to get this update.`
    }
    return ''
  } else if (notificationName === NotificationName.PostgresqlUpgradeCompleted) {
    const { upgrade_type, additional } = notification.data as PostgresqlUpgradeData

    if (upgrade_type === 'postgresql-server') {
      const { version_to } = additional as ServerUpgrade
      return `Postgres (${version_to}) has been successfully updated to ${version_to} for project "${projectName}".`
    } else if (upgrade_type === 'extensions') {
      const { name, version_to } = additional as ExtensionsUpgrade
      return `The extension "${name}" has been successfully updated to ${version_to} for project "${projectName}`
    }
  } else if (notificationName === 'project.update-completed') {
    const { upgrades } = notification.data as ProjectUpdateData
    const upgradesText = upgrades
      .map((upgrade: ServiceUpgrade) => upgrade.name)
      .reduce((a: string, b: string) => `${a}, ${b}`)
    return `The following services have been successfully updated for project "${projectName}": ${upgradesText}`
  } else {
    return `Unknown notification type: ${notification.notification_name} - Please reach out to support for more information`
  }
}
