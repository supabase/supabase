import { SupportCategories } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { CheckCircle, Download, Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useBackupDownloadMutation } from '@/data/database/backup-download-mutation'
import { useDownloadableBackupQuery } from '@/data/database/backup-query'
import { useInvalidateProjectDetailsQuery } from '@/data/projects/project-detail-query'
import { useProjectStatusQuery } from '@/data/projects/project-status-query'
import { useLongRunningTransitionState } from '@/hooks/misc/useLongRunningTransitionState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import {
  clearPersistedTransitionStartTime,
  minutesToMilliseconds,
} from '@/lib/project-transition-state'
import { getRestoreLongRunningThresholdMinutes } from '@/lib/restore-estimate'

export const RestoringState = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [loading, setLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const restoreStateStartStorageKey = ref
    ? LOCAL_STORAGE_KEYS.PROJECT_RESTORING_STARTED_AT(ref)
    : null

  const { data } = useDownloadableBackupQuery({ projectRef: ref })
  const backups = data?.backups ?? []
  const logicalBackups = backups.filter((b) => !b.isPhysicalBackup)
  const longRunningThresholdMinutes = getRestoreLongRunningThresholdMinutes(project?.volumeSizeGb)
  const longRunningThresholdMs = minutesToMilliseconds(longRunningThresholdMinutes)
  const isTakingLongerThanExpected = useLongRunningTransitionState({
    storageKey: restoreStateStartStorageKey,
    thresholdMs: longRunningThresholdMs,
  })

  const { invalidateProjectDetailsQuery } = useInvalidateProjectDetailsQuery()

  const { data: projectStatusData, isSuccess: isProjectStatusSuccess } = useProjectStatusQuery(
    { projectRef: ref },
    {
      enabled: project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY,
      refetchInterval: (query) => {
        const data = query.state.data
        return data?.status === PROJECT_STATUS.ACTIVE_HEALTHY ||
          data?.status === PROJECT_STATUS.RESTORE_FAILED
          ? false
          : 4000
      },
    }
  )

  const { mutate: downloadBackup, isPending: isDownloading } = useBackupDownloadMutation({
    onSuccess: (res) => {
      const { fileUrl } = res

      // Trigger browser download by create,trigger and remove tempLink
      const tempLink = document.createElement('a')
      tempLink.href = fileUrl
      document.body.appendChild(tempLink)
      tempLink.click()
      document.body.removeChild(tempLink)
    },
  })

  const onClickDownloadBackup = () => {
    if (!ref) return console.error('Project ref is required')
    if (logicalBackups.length === 0) return console.error('No available backups to download')

    downloadBackup({ ref, backup: logicalBackups[0] })
  }

  const onConfirm = async () => {
    if (!project) return console.error('Project is required')
    setLoading(true)
    if (ref) await invalidateProjectDetailsQuery(ref)
  }

  useEffect(() => {
    if (!isProjectStatusSuccess) return

    if (projectStatusData.status === PROJECT_STATUS.ACTIVE_HEALTHY) {
      if (restoreStateStartStorageKey) {
        clearPersistedTransitionStartTime(restoreStateStartStorageKey)
      }
      setIsCompleted(true)
    } else if (projectStatusData.status === PROJECT_STATUS.RESTORE_FAILED) {
      if (restoreStateStartStorageKey) {
        clearPersistedTransitionStartTime(restoreStateStartStorageKey)
      }
      if (ref) void invalidateProjectDetailsQuery(ref)
    }
  }, [
    isProjectStatusSuccess,
    projectStatusData,
    restoreStateStartStorageKey,
    ref,
    invalidateProjectDetailsQuery,
  ])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-surface-100 border border-overlay rounded-md w-3/4 lg:w-1/2">
        {isCompleted ? (
          <div className="space-y-6 pt-6">
            <div className="flex px-8 space-x-8">
              <div className="mt-1">
                <CheckCircle className="text-brand" size={18} strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <p>Restoration complete!</p>
                <p className="text-sm text-foreground-light">
                  Your project has been successfully restored and is now back online.
                </p>
              </div>
            </div>
            <div className="border-t border-overlay flex items-center justify-end py-4 px-8">
              <Button disabled={loading} loading={loading} onClick={onConfirm}>
                Return to project
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6 py-6">
              <div className="flex px-8 space-x-8">
                <div className="mt-1">
                  <Loader className="animate-spin" size={18} />
                </div>
                <div className="space-y-1">
                  <p>Restoration in progress</p>
                  <p className="text-sm text-foreground-light">
                    Restoration can take from a few minutes up to several hours depending on the
                    size of your database. Your project will be offline while the restoration is
                    running.
                  </p>
                  {isTakingLongerThanExpected && (
                    <Admonition
                      type="warning"
                      title="This is taking longer than usual"
                      layout="responsive"
                      description="Contact support if this project remains in a restoring state."
                      actions={
                        <Button asChild type="default">
                          <SupportLink
                            queryParams={{
                              category: SupportCategories.DATABASE_UNRESPONSIVE,
                              projectRef: project?.ref ?? ref,
                              subject: 'Project stuck in restoring state',
                              message: `Project "${project?.name ?? 'Unknown project'}" (ref: ${project?.ref ?? ref ?? 'unknown'}) has remained in a restoring state for over ${longRunningThresholdMinutes} minutes.`,
                            }}
                          >
                            Contact support
                          </SupportLink>
                        </Button>
                      }
                      className="mt-5!"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-overlay flex items-center justify-end py-4 px-8 gap-x-2">
              <ButtonTooltip
                type="default"
                icon={<Download />}
                loading={isDownloading}
                disabled={logicalBackups.length === 0}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text:
                      logicalBackups.length === 0 ? 'No available backups to download' : undefined,
                  },
                }}
                onClick={onClickDownloadBackup}
              >
                Download latest backup
              </ButtonTooltip>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
