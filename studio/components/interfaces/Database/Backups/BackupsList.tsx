import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { IconAlertCircle, IconClock, Modal } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import InformationBox from 'components/ui/InformationBox'
import Panel from 'components/ui/Panel'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useBackupRestoreMutation } from 'data/database/backup-restore-mutation'
import { DatabaseBackup, useBackupsQuery } from 'data/database/backups-query'
import { setProjectStatus } from 'data/projects/projects-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'
import BackupItem from './BackupItem'
import BackupsEmpty from './BackupsEmpty'

const BackupsList = () => {
  const { ui } = useStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const organization = useSelectedOrganization()
  const { project: selectedProject } = useProjectContext()
  const projectRef = selectedProject?.ref || 'default'

  const [selectedBackup, setSelectedBackup] = useState<DatabaseBackup>()

  const canTriggerScheduledBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  const { data: backups } = useBackupsQuery({ projectRef })
  const {
    mutate: restoreFromBackup,
    isLoading: isRestoring,
    isSuccess: isSuccessBackup,
  } = useBackupRestoreMutation({
    onSuccess: () => {
      setTimeout(() => {
        setProjectStatus(queryClient, projectRef, PROJECT_STATUS.RESTORING)
        ui.setNotification({
          category: 'success',
          message: `Restoring database back to ${dayjs(selectedBackup?.inserted_at).format(
            'DD MMM YYYY HH:mm:ss'
          )}`,
        })
        router.push(`/project/${projectRef}`)
      }, 3000)
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
        icon={<IconClock size="large" />}
        primaryText="Free Plan does not include project backups."
        projectRef={projectRef}
        organizationSlug={organization!.slug}
        secondaryText="Upgrade to the Pro plan for up to 7 days of scheduled backups."
        addon="pitr"
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
            {!canTriggerScheduledBackups && (
              <InformationBox
                icon={<IconAlertCircle className="text-foreground-light" strokeWidth={2} />}
                title="You need additional permissions to trigger a scheduled backup"
              />
            )}
            <Panel>
              {sortedBackups?.map((x, i: number) => {
                return (
                  <BackupItem
                    key={x.id}
                    backup={x}
                    projectRef={projectRef}
                    index={i}
                    onSelectBackup={() => setSelectedBackup(x)}
                  />
                )
              })}
            </Panel>
          </>
        )}
      </div>
      <ConfirmationModal
        size="medium"
        buttonLabel="Confirm restore"
        buttonLoadingLabel="Restoring"
        visible={selectedBackup !== undefined}
        header="Confirm to restore from backup"
        loading={isRestoring || isSuccessBackup}
        onSelectCancel={() => setSelectedBackup(undefined)}
        onSelectConfirm={() => {
          if (selectedBackup === undefined) return console.error('Backup required')
          restoreFromBackup({ ref: projectRef, backup: selectedBackup })
        }}
      >
        <Modal.Content>
          <div className="pt-6 pb-5">
            <p>
              Are you sure you want to restore from
              {dayjs(selectedBackup?.inserted_at).format('DD MMM YYYY')}? This will destroy any new
              data written since this backup was made.
            </p>
          </div>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default observer(BackupsList)
