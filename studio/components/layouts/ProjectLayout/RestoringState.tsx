import { FC, useEffect, useRef, useState } from 'react'
import { Button, IconCheckCircle, IconLoader } from 'ui'

import { useStore } from 'hooks'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { getWithTimeout } from 'lib/common/fetch'

interface Props {}

const RestoringState: FC<Props> = ({}) => {
  const { app, ui } = useStore()
  const project = ui.selectedProject
  const checkServerInterval = useRef<number>()

  const [loading, setLoading] = useState(false)
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
      if (status === PROJECT_STATUS.ACTIVE_HEALTHY) {
        clearInterval(checkServerInterval.current)
        setIsCompleted(true)
      }
    }
  }

  const onConfirm = async () => {
    setLoading(true)
    await app.projects.fetchDetail(project?.ref ?? '')
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className={[
          'grid grid-cols-12 gap-4',
          'bg-scale-300 border border-scale-400 rounded-md w-3/4 lg:w-1/2 px-8 py-6',
        ].join(' ')}
      >
        {isCompleted ? (
          <>
            <div className="col-span-1">
              <IconCheckCircle className="text-brand-900" strokeWidth={2} />
            </div>
            <div className="col-span-11 space-y-1">
              <p>Restoration complete!</p>
              <p className="text-sm text-scale-1100">
                Your project has been successfully restored and is now back online.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="col-span-1">
              <IconLoader className="animate-spin" />
            </div>
            <div className="col-span-11 space-y-1">
              <p>Restoration in progress</p>
              <p className="text-sm text-scale-1100">
                Restoration can take from a few minutes up to several hours depending on the size of
                your database. Your project will be offline while the restoration is running.
              </p>
            </div>
          </>
        )}
        {isCompleted && (
          <div className="col-start-2 col-span-11">
            <Button disabled={loading} loading={loading} onClick={onConfirm}>
              Return to project
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RestoringState
