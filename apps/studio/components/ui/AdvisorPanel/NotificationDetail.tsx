import { Archive, ArchiveRestoreIcon, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { Markdown } from 'components/interfaces/Markdown'
import { Notification, NotificationData } from 'data/notifications/notifications-v2-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'

interface NotificationDetailProps {
  notification: Notification
  onUpdateStatus: (id: string, status: 'archived' | 'seen') => void
}

export const NotificationDetail = ({ notification, onUpdateStatus }: NotificationDetailProps) => {
  const data = notification.data as NotificationData

  const { data: project } = useProjectDetailQuery({ ref: data.project_ref })
  const { data: organizations } = useOrganizationsQuery()

  const organization =
    data.org_slug !== undefined
      ? organizations?.find((org) => org.slug === data.org_slug)
      : project !== undefined
        ? organizations?.find((org) => org.id === project.organization_id)
        : undefined

  const onButtonAction = (type?: string) => {
    // [Joshen] Implement accordingly - BE team will need to give us a heads up on this
    console.log('Action', type)
  }

  return (
    <div>
      {(project !== undefined || organization !== undefined) && (
        <>
          <h3 className="text-sm mb-2">Context</h3>
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {organization !== undefined && (
              <Link
                title={organization.name}
                href={`/org/${organization.slug}/general`}
                className="text-link"
              >
                {organization.name}
              </Link>
            )}
            {project !== undefined && (
              <Link title={project.name} href={`/project/${project.ref}`} className="text-link">
                {project.name}
              </Link>
            )}
          </div>
        </>
      )}

      {data.message !== undefined && (
        <>
          <h3 className="text-sm mb-2">Message</h3>
          <Markdown
            className="leading-6 text-sm text-foreground-light mb-6"
            content={data.message}
          />
        </>
      )}

      <h3 className="text-sm mb-2">Actions</h3>
      <div className="flex items-center gap-2">
        {(data.actions ?? []).map((action, idx) => {
          const key = `${notification.id}-action-${idx}`
          if (action.url !== undefined) {
            const url = action.url.includes('[ref]')
              ? action.url.replace('[ref]', project?.ref ?? '_')
              : action.url.includes('[slug]')
                ? action.url.replace('[slug]', organization?.slug ?? '_')
                : action.url
            return (
              <Button key={key} type="default" icon={<ExternalLink strokeWidth={1.5} />} asChild>
                <Link href={url} target="_blank" rel="noreferrer">
                  {action.label}
                </Link>
              </Button>
            )
          } else if (action.action_type !== undefined) {
            return (
              <Button key={key} type="default" onClick={() => onButtonAction(action.action_type)}>
                {action.label}
              </Button>
            )
          } else {
            return null
          }
        })}
        {notification.status === 'archived' ? (
          <Button
            type="default"
            icon={<ArchiveRestoreIcon size={14} strokeWidth={1.5} />}
            onClick={() => onUpdateStatus(notification.id, 'seen')}
          >
            Unarchive
          </Button>
        ) : (
          <Button
            type="default"
            icon={<Archive size={14} strokeWidth={1.5} />}
            onClick={() => onUpdateStatus(notification.id, 'archived')}
          >
            Archive
          </Button>
        )}
      </div>
    </div>
  )
}
