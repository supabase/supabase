import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Clock } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Panel from 'components/ui/Panel'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useBackupRestoreMutation } from 'data/database/backup-restore-mutation'
import { DatabaseBackup, useBackupsQuery } from 'data/database/backups-query'
import { setProjectStatus } from 'data/projects/projects-query'
import { PROJECT_STATUS } from 'lib/constants'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import BackupItem from './BackupItem'
import BackupsEmpty from './BackupsEmpty'
import BackupsStorageAlert from './BackupsStorageAlert'
import { useParams } from 'common'

const BackupsList = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()

  const { project: selectedProject } = useProjectContext()
  const isHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const [selectedBackup, setSelectedBackup] = useState<DatabaseBackup>()

  const { data: backups } = useBackupsQuery({ projectRef })
  const {
    mutate: restoreFromBackup,
    isLoading: isRestoring,
    isSuccess: isSuccessBackup,
  } = useBackupRestoreMutation({
    onSuccess: () => {
      if (projectRef) {
        setTimeout(() => {
          setProjectStatus(queryClient, projectRef, PROJECT_STATUS.RESTORING)
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

  const planKey = backups?.tierKey ?? ''
  const sortedBackups = (backups?.backups ?? []).sort(
    (a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
  )
  const isPitrEnabled = backups?.pitr_enabled

  if (planKey === 'FREE') {
    return (
      <UpgradeToPro
        addon="pitr"
        icon={<Clock size={20} />}
        primaryText="Free Plan does not include project backups."
        secondaryText="Upgrade to the Pro Plan for up to 7 days of scheduled backups."
      />
    )
  }

  if (isPitrEnabled) return null

  return (
    <>
      <div className="space-y-6">
        {sortedBackups.length === 0 && planKey !== 'FREE' ? (
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
        confirmLabel="Confirm restore"
        confirmLabelLoading="Restoring"
        visible={selectedBackup !== undefined}
        title="Confirm to restore from backup"
        loading={isRestoring || isSuccessBackup}
        onCancel={() => setSelectedBackup(undefined)}
        onConfirm={() => {
          if (projectRef === undefined) return console.error('Project ref required')
          if (selectedBackup === undefined) return console.error('Backup required')
          restoreFromBackup({ ref: projectRef, backup: selectedBackup })
        }}
      >
        <p className="text-sm">
          Are you sure you want to restore from{' '}
          {dayjs(selectedBackup?.inserted_at).format('DD MMM YYYY')}? This will destroy any new data
          written since this backup was made.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default BackupsList
