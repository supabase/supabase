import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useBackupsQuery } from 'data/database/backups-query'
import { usePitrRestoreMutation } from 'data/database/pitr-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { PROJECT_STATUS } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Modal,
  WarningIcon,
} from 'ui'
import BackupsEmpty from '../BackupsEmpty'
import BackupsStorageAlert from '../BackupsStorageAlert'
import type { Timezone } from './PITR.types'
import { getClientTimezone } from './PITR.utils'
import PITRStatus from './PITRStatus'
import { PITRForm } from './pitr-form'

const PITRSelection = () => {
  const router = useRouter()
  const { ref } = useParams()
  const queryClient = useQueryClient()

  const { data: backups } = useBackupsQuery({ projectRef: ref })
  const { data: databases } = useReadReplicasQuery({ projectRef: ref })
  const [showConfiguration, setShowConfiguration] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getClientTimezone())
  const [selectedRecoveryPoint, setSelectedRecoveryPoint] = useState<{
    recoveryTimeTargetUnix: number
    recoveryTimeString: string
    recoveryTimeStringUtc: string
  }>()

  const hasReadReplicas = (databases ?? []).length > 1

  const {
    mutate: restoreFromPitr,
    isLoading: isRestoring,
    isSuccess: isSuccessPITR,
  } = usePitrRestoreMutation({
    onSuccess: (res, variables) => {
      setTimeout(() => {
        setShowConfirmation(false)
        setProjectStatus(queryClient, variables.ref, PROJECT_STATUS.RESTORING)
        router.push(`/project/${variables.ref}`)
      }, 3000)
    },
  })

  const { earliestPhysicalBackupDateUnix, latestPhysicalBackupDateUnix } =
    backups?.physicalBackupData ?? {}
  const hasNoBackupsAvailable = !earliestPhysicalBackupDateUnix || !latestPhysicalBackupDateUnix

  const onConfirmRestore = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!selectedRecoveryPoint?.recoveryTimeTargetUnix)
      return console.error('Recovery time target unix is required')

    restoreFromPitr({
      ref,
      recovery_time_target_unix: selectedRecoveryPoint.recoveryTimeTargetUnix,
    })
  }

  return (
    <>
      <FormHeader
        title="Restore your database from a backup"
        description="Database changes are watched and recorded, so that you can restore your database to any point in time"
      />
      <BackupsStorageAlert />
      {hasNoBackupsAvailable ? (
        <BackupsEmpty />
      ) : (
        <>
          {hasReadReplicas && (
            <Alert_Shadcn_ variant="warning">
              <WarningIcon />
              <AlertTitle_Shadcn_>
                Unable to restore from PITR as project has read replicas enabled
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                You will need to remove all read replicas first from your project's infrastructure
                settings prior to starting a PITR restore.
              </AlertDescription_Shadcn_>
              <div className="flex items-center gap-x-2 mt-2">
                {/* [Joshen] Ideally we have some links to a docs to explain why so */}
                <Button type="default">
                  <Link href={`/project/${ref}/settings/infrastructure`}>
                    Infrastructure settings
                  </Link>
                </Button>
              </div>
            </Alert_Shadcn_>
          )}
          {!showConfiguration ? (
            <PITRStatus
              selectedTimezone={selectedTimezone}
              onUpdateTimezone={setSelectedTimezone}
              onSetConfiguration={() => setShowConfiguration(true)}
            />
          ) : (
            <PITRForm
              earliestAvailableBackupUnix={earliestPhysicalBackupDateUnix}
              latestAvailableBackupUnix={latestPhysicalBackupDateUnix}
              onSubmit={(recoveryPoint) => {
                setSelectedRecoveryPoint(recoveryPoint)
                setShowConfirmation(true)
              }}
            />
          )}
        </>
      )}

      <Modal
        size="medium"
        visible={showConfirmation}
        onCancel={() => setShowConfirmation(false)}
        header="Point in time recovery review"
        customFooter={
          <div className="flex items-center justify-end space-x-2">
            <Button
              type="default"
              disabled={isRestoring || isSuccessPITR}
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              type="warning"
              disabled={isRestoring || isSuccessPITR}
              loading={isRestoring || isSuccessPITR}
              onClick={onConfirmRestore}
            >
              I understand, begin restore
            </Button>
          </div>
        }
      >
        <Modal.Content>
          <div className="py-2 space-y-1">
            <p className="text-sm text-foreground-light">Your database will be restored to:</p>
          </div>
          <div className="py-2 flex flex-col gap-3">
            <div>
              <p className="text-sm font-mono text-foreground-lighter">Local Time</p>
              <p className="text-2xl">{selectedRecoveryPoint?.recoveryTimeString}</p>
            </div>
            <div>
              <p className="text-sm font-mono text-foreground-lighter">(UTC+00:00)</p>
              <p className="text-2xl">{selectedRecoveryPoint?.recoveryTimeStringUtc}</p>
            </div>
          </div>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>
              This action cannot be undone, not canceled once started
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Any changes made to your database after this point in time will be lost. This includes
              any changes to your project's storage and authentication.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <p className="text-sm text-foreground-light">
            Restores may take from a few minutes up to several hours depending on the size of your
            database. During this period, your project will not be available, until the restoration
            is completed.
          </p>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default PITRSelection
