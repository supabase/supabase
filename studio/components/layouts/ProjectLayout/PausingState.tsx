import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { Badge, IconCircle, IconLoader } from 'ui'

import { useProjectStatusQuery } from 'data/projects/project-status-query'
import { invalidateProjectsQuery } from 'data/projects/projects-query'
import { PROJECT_STATUS } from 'lib/constants'
import { Project } from 'types'
import { useEffect, useState } from 'react'
import { invalidateProjectDetailsQuery } from 'data/projects/project-detail-query'

export interface PausingStateProps {
  project: Project
}

const PausingState = ({ project }: PausingStateProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const [startPolling, setStartPolling] = useState(false)

  useProjectStatusQuery(
    { projectRef: ref },
    {
      enabled: startPolling,
      refetchInterval: (res) => {
        return res?.status === PROJECT_STATUS.INACTIVE ? false : 2000
      },
      onSuccess: async (res) => {
        if (res.status === PROJECT_STATUS.INACTIVE) {
          if (ref) await invalidateProjectDetailsQuery(queryClient, ref)
          await invalidateProjectsQuery(queryClient)
        }
      },
    }
  )

  useEffect(() => {
    setTimeout(() => setStartPolling(true), 4000)
  }, [])

  return (
    <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
      <div className="mx-6 space-y-16">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
          <h1 className="text-3xl">{project.name}</h1>
          <div>
            <Badge color="gray">
              <div className="flex items-center gap-2">
                <IconLoader className="animate-spin" size={12} />
                <span>Pausing project</span>
              </div>
            </Badge>
          </div>
        </div>
        <div className="mx-auto mt-8 mb-16 w-full max-w-7xl">
          <div className="mx-6 flex h-[500px] items-center justify-center rounded border border-scale-400 bg-scale-300 p-8">
            <div className="grid w-[380px] gap-4">
              <div className="relative mx-auto max-w-[300px]">
                <div className="absolute flex h-full w-full items-center justify-center">
                  <IconLoader className="animate-spin" size={20} strokeWidth={2} />
                </div>
                <IconCircle className="text-scale-900" size={50} strokeWidth={1.5} />
              </div>
              <p className="text-center">Pausing {project.name}</p>
              <p className="mt-4 text-center text-sm text-scale-1100">
                You may restore your project anytime thereafter, and your data will be restored to
                when it was initially paused.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PausingState
