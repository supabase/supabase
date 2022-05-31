import { Project } from 'types'
import { Notification, NotificationName } from '@supabase/shared-types/out/notifications'

// Switch to proper typing with NotificationName after PR is in
export const formatNotificationText = (project: Project, notification: Notification) => {
  const projectName = project.name
  const notificationName = notification.notification_name

  if (notificationName === NotificationName.ProjectExceedingTierLimit) {
    const { violations } = notification.data
    const violationsText = violations
      .map((violation: any) => violation.dimension)
      .reduce((a: string, b: string) => `${a}, ${b}`)

    return `Your project "${projectName}" has exceeded its limits in the following areas: ${violationsText}. Please upgrade your project to ensure continued availability.`
  } else if (notificationName === 'postgresql.upgrade-available') {
    const { upgrade_type, additional } = notification.data
    const { name, version_to } = additional
    if (upgrade_type === 'postgresql-server') {
      return `A new version of Postgres (${version_to}) is now available for project "${projectName}". You may restart your project to get this update.`
    } else if (upgrade_type === 'extensions') {
      return `A new version of the extension "${name}" (${version_to}) is now available for project "${projectName}". You may restart your project to get this update.`
    }
    return ''
  } else if (notificationName === 'postgresql.upgrade-completed') {
    const { upgrade_type, additional } = notification.data
    const { name, version_to } = additional
    if (upgrade_type === 'postgresql-server') {
      return `Postgres (${version_to}) has been successfully updated to ${version_to} for project "${projectName}".`
    } else if (upgrade_type === 'extensions') {
      return `The extension "${name}" has been successfully updated to ${version_to} for project "${projectName}`
    }
  } else if (notificationName === 'project.update-completed') {
    const { upgrades } = notification.data
    const upgradesText = upgrades
      .map((upgrade: any) => upgrade.name)
      .reduce((a: string, b: string) => `${a}, ${b}`)
    return `The following services have been successfully updated for project "${projectName}": ${upgradesText}`
  } else {
    return `Unknown notification type: ${notification.notification_name} - Please reach out to support for more information`
  }
}
