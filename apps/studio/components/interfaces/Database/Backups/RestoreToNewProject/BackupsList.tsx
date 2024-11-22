import Panel from 'components/ui/Panel'
import BackupsEmpty from '../BackupsEmpty'
import { useCloneBackupsQuery } from 'data/projects/clone-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Badge, Button } from 'ui'
import { TimestampInfo } from 'ui-patterns'

interface BackupsListProps {
  onSelectRestore: (id: number) => void
}

export const BackupsList = ({ onSelectRestore }: BackupsListProps) => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const isFreePlan = subscription?.plan?.id === 'free'

  const { data: cloneBackups } = useCloneBackupsQuery(
    { projectRef: project?.ref },
    { enabled: !isFreePlan }
  )

  return (
    <Panel>
      {cloneBackups?.backups.length === 0 ? (
        <>
          <BackupsEmpty />
        </>
      ) : (
        <div className="divide-y">
          {/* <pre>{JSON.stringify({ cloneStatus }, null, 2)}</pre> */}
          {cloneBackups?.backups.map((backup) => {
            if (!backup.isPhysicalBackup) return null
            return (
              <div className="flex p-4 gap-4" key={backup.id}>
                <div>
                  <TimestampInfo value={backup.inserted_at} />
                </div>
                <Badge>{JSON.stringify(backup.status).replaceAll('"', '')}</Badge>
                {(backup.status as any) === 'COMPLETED' && (
                  <Button
                    className="ml-auto"
                    type="outline"
                    onClick={() => onSelectRestore(backup.id)}
                  >
                    Restore
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
