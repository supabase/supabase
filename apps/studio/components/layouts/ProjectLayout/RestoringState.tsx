import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Download, Loader } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import { useDownloadableBackupQuery } from 'data/database/backup-query'
import { invalidateProjectDetailsQuery } from 'data/projects/project-detail-query'
import { useProjectStatusQuery } from 'data/projects/project-status-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { Button } from 'ui'

const RestoringState = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()

  const [loading, setLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const { data } = useDownloadableBackupQuery({ projectRef: ref })
  const backups = data?.backups ?? []
  const logicalBackups = backups.filter((b) => !b.isPhysicalBackup)

  useProjectStatusQuery(
    { projectRef: ref },
    {
      enabled: project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY,
      refetchInterval: (res) => {
        return res?.status === PROJECT_STATUS.ACTIVE_HEALTHY ? false : 4000
      },
      onSuccess: async (res) => {
        if (res.status === PROJECT_STATUS.ACTIVE_HEALTHY) {
          setIsCompleted(true)
        } else {
          if (ref) invalidateProjectDetailsQuery(queryClient, ref)
        }
      },
    }
  )

  const { mutate: downloadBackup, isLoading: isDownloading } = useBackupDownloadMutation({
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
    if (ref) await invalidateProjectDetailsQuery(queryClient, ref)
  }

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
                </div>
              </div>
            </div>
            <div className="border-t border-overlay flex items-center justify-end py-4 px-8 gap-x-2">
              <Button asChild type="default">
                <Link
                  href={`/support/new?category=Database_unresponsive&ref=${project?.ref}&subject=Restoration%20failed%20for%20project`}
                >
                  Contact support
                </Link>
              </Button>
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

export default RestoringState
