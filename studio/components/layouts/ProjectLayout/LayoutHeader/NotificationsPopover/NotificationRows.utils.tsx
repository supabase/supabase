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
import { Markdown } from 'components/interfaces/Markdown'
import dayjs from 'dayjs'
import Link from 'next/link'
import { Project } from 'types'
import { Button, IconArrowRight, IconExternalLink } from 'ui'

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
      return (
        <p className="text-sm">
          The schema migration "{version_to}" has been successfully applied for project "
          {projectName}".
        </p>
      )
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
                    <Link href={upgrade.changelog_link} target="_blank" rel="noreferrer">
                      <IconExternalLink
                        className="cursor-pointer text-foreground-light hover:text-foreground transition"
                        size={12}
                        strokeWidth={2}
                      />
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
    const buttons = notification.data.linked_buttons ?? []
    return (
      <>
        <Markdown content={notification.data.message} className="text-foreground" />
        {buttons.map((button, index) => {
          return (
            <a href={button.url} key={index} target="_blank">
              <Button
                asChild
                type="default"
                className="mr-2 mt-2 mb-2"
                icon={<IconExternalLink size={12} strokeWidth={2} />}
              >
                <span>{button.text}</span>
              </Button>
            </a>
          )
        })}
      </>
    )
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
        return (
          <p className="text-sm space-x-1">
            This patch will be automatically applied after{' '}
            {dayjs(new Date(action.deadline)).format('DD MMM YYYY, HH:mma')}
          </p>
        )
      }
    default:
      return ''
  }
}
