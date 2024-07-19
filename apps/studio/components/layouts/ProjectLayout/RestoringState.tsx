import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useEffect, useRef, useState } from 'react'
import { Button, IconCheckCircle, IconLoader } from 'ui'

import { projectKeys } from 'data/projects/keys'
import { invalidateProjectDetailsQuery } from 'data/projects/project-detail-query'
import { getWithTimeout } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { useProjectContext } from './ProjectContext'

const RestoringState = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
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
      } else {
        queryClient.invalidateQueries(projectKeys.detail(ref))
      }
    }
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
                <IconCheckCircle className="text-brand" size={18} strokeWidth={2} />
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
          <div className="space-y-6 py-6">
            <div className="flex px-8 space-x-8">
              <div className="mt-1">
                <IconLoader className="animate-spin" size={18} />
              </div>
              <div className="space-y-1">
                <p>Restoration in progress</p>
                <p className="text-sm text-foreground-light">
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
