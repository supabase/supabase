import Panel from 'components/ui/Panel'
import { useCloneBackupsQuery } from 'data/projects/clone-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Badge, Button } from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { BackupsEmpty } from '../BackupsEmpty'

interface BackupsListProps {
  onSelectRestore: (id: number) => void
  disabled?: boolean
}

export const BackupsList = ({ onSelectRestore, disabled }: BackupsListProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const isFreePlan = organization?.plan?.id === 'free'

  const { data: cloneBackups } = useCloneBackupsQuery(
    { projectRef: project?.ref },
    { enabled: !isFreePlan }
  )

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Available Backups</h3>
      <Panel>
        {cloneBackups?.backups.length === 0 ? (
          <BackupsEmpty />
        ) : (
          <div className="divide-y">
            {cloneBackups?.backups.map((backup) => {
              if (!backup.isPhysicalBackup) return null
              return (
                <div className="grid grid-cols-4 gap-4 items-center p-4" key={backup.id}>
                  <div>
                    <TimestampInfo
                      displayAs="utc"
                      utcTimestamp={backup.inserted_at}
                      labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
                      className="text-left !text-sm font-mono tracking-tight"
                    />
                  </div>
                  <div>
                    <Badge>{JSON.stringify(backup.status).replaceAll('"', '')}</Badge>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {(backup.status as any) === 'COMPLETED' && (
                      <Button
                        className="ml-auto"
                        type="outline"
                        onClick={() => onSelectRestore(backup.id)}
                        disabled={disabled}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
