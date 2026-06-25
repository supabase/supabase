import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertTitle,
  Button,
  DialogSection,
  DialogSectionSeparator,
  WarningIcon,
} from 'ui'

import { BackupsEmpty } from '../BackupsEmpty'
import { BackupsStorageAlert } from '../BackupsStorageAlert'
import type { Timezone } from './PITR.types'
import { getClientTimezone } from './PITR.utils'
import { PITRForm } from './PITRForm'
import PITRStatus from './PITRStatus'
import { FormHeader } from '@/components/ui/Forms/FormHeader'
import { useBackupsQuery } from '@/data/database/backups-query'
import { usePitrRestoreMutation } from '@/data/database/pitr-restore-mutation'
import { useSetProjectStatus } from '@/data/projects/project-detail-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { PROJECT_STATUS } from '@/lib/constants'

export const PITRSelection = () => {
  const router = useRouter()
  const { ref } = useParams()

  const { data: backups } = useBackupsQuery({ projectRef: ref })
  const { data: databases } = useReadReplicasQuery({ projectRef: ref })
  const { setProjectStatus } = useSetProjectStatus()

  const [showConfiguration, setShowConfiguration] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getClientTimezone())
  const [selectedRecoveryPoint, setSelectedRecoveryPoint] = useState<{
    recoveryTimeTargetUnix: number
    recoveryTimeString: string
    recoveryTimeStringUtc: string
  }>()

  const hasReadReplicas = (databases ?? []).length > 1

  const { mutateAsync: restoreFromPitr } = usePitrRestoreMutation({
    onSuccess: (_, variables) => {
      setTimeout(() => {
        setShowConfirmation(false)
        setProjectStatus({ ref: variables.ref, status: PROJECT_STATUS.RESTORING })
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

    await restoreFromPitr({
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
            <Alert variant="warning">
              <WarningIcon />
              <AlertTitle>
                Unable to restore from PITR as project has read replicas enabled
              </AlertTitle>
              <AlertDescription>
                You will need to remove all read replicas first from your project's infrastructure
                settings prior to starting a PITR restore.
              </AlertDescription>
              <div className="flex items-center gap-x-2 mt-2">
                {/* [Joshen] Ideally we have some links to a docs to explain why so */}
                <Button variant="default">
                  <Link href={`/project/${ref}/settings/infrastructure`}>
                    Infrastructure settings
                  </Link>
                </Button>
              </div>
            </Alert>
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

      <AlertDialog open={showConfirmation} onOpenChange={(open) => setShowConfirmation(open)}>
        <AlertDialogContent size="medium">
          <AlertDialogHeader>
            <AlertDialogTitle>Point in time recovery review</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-foreground-light">Your database will be restored to:</p>
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
              </div>
            </AlertDialogDescription>
            <DialogSectionSeparator />
            <DialogSection>
              <Alert variant="warning">
                <WarningIcon />
                <AlertTitle>This action cannot be undone, not canceled once started</AlertTitle>
                <AlertDescription>
                  Any changes made to your database after this point in time will be lost. This
                  includes any changes to your project's storage and authentication.
                </AlertDescription>
              </Alert>
            </DialogSection>
            <DialogSectionSeparator />
            <DialogSection>
              <p className="text-sm text-foreground-light">
                Restores may take from a few minutes up to several hours depending on the size of
                your database. During this period, your project will not be available, until the
                restoration is completed.
              </p>
            </DialogSection>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="warning" onClick={onConfirmRestore}>
                I understand, begin restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
