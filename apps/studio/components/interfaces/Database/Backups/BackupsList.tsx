import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useBackupRestoreMutation } from 'data/database/backup-restore-mutation'
import { DatabaseBackup, useBackupsQuery } from 'data/database/backups-query'
import { useSetProjectStatus } from 'data/projects/project-detail-query'
import dayjs from 'dayjs'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { Clock } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import { TimestampInfo } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { Admonition } from 'ui-patterns/admonition'

import { BackupItem } from './BackupItem'
import { BackupsEmpty } from './BackupsEmpty'
import { BackupsStorageAlert } from './BackupsStorageAlert'

export const BackupsList = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [selectedBackup, setSelectedBackup] = useState<DatabaseBackup>()
  const { hasAccess: hasAccessToBackups } = useCheckEntitlements('backup.retention_days')

  const { setProjectStatus } = useSetProjectStatus()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const { data: backups } = useBackupsQuery({ projectRef })
  const {
    mutate: restoreFromBackup,
    isPending: isRestoring,
    isSuccess: isSuccessBackup,
  } = useBackupRestoreMutation({
    onSuccess: () => {
      if (projectRef) {
        setTimeout(() => {
          setProjectStatus({ ref: projectRef, status: PROJECT_STATUS.RESTORING })
          toast.success(
            `Restoring database back to ${dayjs(selectedBackup?.inserted_at).format(
              'DD MMM YYYY HH:mm:ss'
            )}`
          )
          router.push(`/project/${projectRef}`)
        }, 3000)
      }
    },
  })

  const sortedBackups = (backups?.backups ?? []).sort(
    (a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
  )
  const isPitrEnabled = backups?.pitr_enabled

  if (!hasAccessToBackups) {
    return (
      <UpgradeToPro
        addon="pitr"
        source="backups"
        featureProposition="have up to 7 days of scheduled backups"
        icon={<Clock size={20} />}
        primaryText="Free Plan does not include project backups."
        secondaryText="Upgrade to the Pro Plan for up to 7 days of scheduled backups."
        buttonText="Upgrade"
      />
    )
  }

  if (isPitrEnabled) return null

  return (
    <>
      <div className="space-y-6">
        {sortedBackups.length === 0 ? (
          <BackupsEmpty />
        ) : (
          <>
            <BackupsStorageAlert />
            <Panel>
              {sortedBackups?.map((x, i: number) => {
                return (
                  <BackupItem
                    key={x.id}
                    backup={x}
                    index={i}
                    isHealthy={isHealthy}
                    onSelectBackup={() => setSelectedBackup(x)}
                  />
                )
              })}
            </Panel>
          </>
        )}
      </div>
      <ConfirmationModal
        size="small"
        confirmLabel="Restore"
        confirmLabelLoading="Restoring..."
        variant="warning"
        visible={selectedBackup !== undefined}
        title="Restore from backup"
        loading={isRestoring || isSuccessBackup}
        onCancel={() => setSelectedBackup(undefined)}
        onConfirm={() => {
          if (projectRef === undefined) return console.error('Project ref required')
          if (selectedBackup === undefined) return console.error('Backup required')
          restoreFromBackup({ ref: projectRef, backup: selectedBackup })
        }}
      >
        <div className="space-y-3">
          {!!selectedBackup && (
            <p className="text-sm">
              This will restore your database to the backup made on{' '}
              <TimestampInfo
                displayAs="utc"
                utcTimestamp={selectedBackup.inserted_at}
                labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
                className="!text-sm"
              />
            </p>
          )}

          <Admonition
            showIcon={false}
            type="warning"
            title="This action cannot be undone"
            description={
              <ul className="list-disc list-inside">
                <li>Your project will be offline during restoration</li>
                <li>Any new data since this backup will be lost</li>
              </ul>
            }
          />
        </div>
      </ConfirmationModal>
    </>
  )
}
