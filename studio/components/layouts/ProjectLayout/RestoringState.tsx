import Link from 'next/link'
import { FC, useEffect, useRef, useState } from 'react'
import { Button, IconAlertCircle, IconCheckCircle, IconLoader } from 'ui'

import { useStore } from 'hooks'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { getWithTimeout } from 'lib/common/fetch'

interface Props {}

const RestoringState: FC<Props> = ({}) => {
  const { app, ui, meta } = useStore()
  const project = ui.selectedProject
  const checkServerInterval = useRef<number>()

  const [loading, setLoading] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    checkServerInterval.current = window.setInterval(checkServer, 4000)
    return () => clearInterval(checkServerInterval.current)
  }, [])

  async function checkServer() {
    if (!project) return

    const projectStatus = await getWithTimeout(`${API_URL}/projects/${project.ref}/status`, {
      timeout: 2000,
    })
    if (projectStatus && !projectStatus.error) {
      const { status } = projectStatus
      if (status === PROJECT_STATUS.RESTORATION_FAILED) {
        clearInterval(checkServerInterval.current)
        setIsFailed(true)
      } else if (status === PROJECT_STATUS.ACTIVE_HEALTHY) {
        clearInterval(checkServerInterval.current)
        setIsCompleted(true)
      }
    }
  }

  const onConfirm = async () => {
    setLoading(true)
    await app.projects.fetchDetail(project?.ref ?? '', (project) => meta.setProjectDetails(project))
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-scale-300 border border-scale-400 rounded-md w-3/4 lg:w-1/2">
        {isCompleted ? (
          <div className="space-y-6 pt-6">
            <div className="flex px-8 space-x-8">
              <div className="mt-1">
                <IconCheckCircle className="text-brand-900" size={18} strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <p>Restoration complete!</p>
                <p className="text-sm text-scale-1100">
                  Your project has been successfully restored and is now back online.
                </p>
              </div>
            </div>
            <div className="border-t border-scale-400 flex items-center justify-end py-4 px-8">
              <Button disabled={loading} loading={loading} onClick={onConfirm}>
                Return to project
              </Button>
            </div>
          </div>
        ) : isFailed ? (
          <div className="space-y-6 pt-6">
            <div className="flex px-8 space-x-8">
              <div className="mt-1">
                <IconAlertCircle size={18} strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <p>Something went wrong while restoring your project</p>
                <p className="text-sm text-scale-1100">
                  Our engineers have already been notified of this, do hang tight while we are
                  investigating into the issue.
                </p>
              </div>
            </div>
            {isFailed && (
              <div className="border-t border-scale-400 flex items-center justify-end py-4 px-8">
                <Link
                  href={`/support/new?category=Database_unresponsive&ref=${project?.ref}&subject=Restoration%20failed%20for%20project`}
                >
                  <a>
                    <Button type="default">Contact support</Button>
                  </a>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <div className="flex px-8 space-x-8">
              <div className="mt-1">
                <IconLoader className="animate-spin" size={18} />
              </div>
              <div className="space-y-1">
                <p>Restoration in progress</p>
                <p className="text-sm text-scale-1100">
                  Restoration can take from a few minutes up to several hours depending on the size
                  of your database. Your project will be offline while the restoration is running.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RestoringState
