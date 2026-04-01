import { SupportCategories } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Circle, Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button } from 'ui'

import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { useInvalidateProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { Project, useInvalidateProjectDetailsQuery } from '@/data/projects/project-detail-query'
import { useProjectStatusQuery } from '@/data/projects/project-status-query'
import { useLongRunningTransitionState } from '@/hooks/misc/useLongRunningTransitionState'
import { PROJECT_STATUS } from '@/lib/constants'
import {
  clearPersistedTransitionStartTime,
  FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES,
  minutesToMilliseconds,
} from '@/lib/project-transition-state'

const LONG_RUNNING_STATE_THRESHOLD_MINUTES = FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES
const LONG_RUNNING_STATE_THRESHOLD_MS = minutesToMilliseconds(LONG_RUNNING_STATE_THRESHOLD_MINUTES)

export interface PausingStateProps {
  project: Project
}

export const PausingState = ({ project }: PausingStateProps) => {
  const { ref } = useParams()
  const [startPolling, setStartPolling] = useState(false)
  const pauseStateStartStorageKey = ref ? LOCAL_STORAGE_KEYS.PROJECT_PAUSING_STARTED_AT(ref) : null
  const isTakingLongerThanExpected = useLongRunningTransitionState({
    storageKey: pauseStateStartStorageKey,
    thresholdMs: LONG_RUNNING_STATE_THRESHOLD_MS,
  })

  const { invalidateProjectsQuery } = useInvalidateProjectsInfiniteQuery()
  const { invalidateProjectDetailsQuery } = useInvalidateProjectDetailsQuery()

  const { data: projectStatusData, isSuccess: isProjectStatusSuccess } = useProjectStatusQuery(
    { projectRef: ref },
    {
      enabled: startPolling,
      refetchInterval: (query) => {
        const data = query.state.data
        return data?.status === PROJECT_STATUS.INACTIVE ||
          data?.status === PROJECT_STATUS.PAUSE_FAILED
          ? false
          : 2000
      },
    }
  )

  useEffect(() => {
    if (!isProjectStatusSuccess) return
    if (
      projectStatusData?.status === PROJECT_STATUS.INACTIVE ||
      projectStatusData?.status === PROJECT_STATUS.PAUSE_FAILED
    ) {
      if (pauseStateStartStorageKey) {
        clearPersistedTransitionStartTime(pauseStateStartStorageKey)
      }
      if (ref) invalidateProjectDetailsQuery(ref)
      invalidateProjectsQuery()
    }
  }, [
    isProjectStatusSuccess,
    projectStatusData,
    pauseStateStartStorageKey,
    ref,
    invalidateProjectDetailsQuery,
    invalidateProjectsQuery,
  ])

  useEffect(() => {
    const timeoutId = setTimeout(() => setStartPolling(true), 4000)
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
      <div className="mx-6 space-y-16">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
          <h1 className="text-3xl">{project.name}</h1>
          <div>
            <Badge>
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" size={12} />
                <span>Pausing project</span>
              </div>
            </Badge>
          </div>
        </div>
        <div className="mx-auto mt-8 mb-16 w-full max-w-7xl">
          <div className="flex h-[500px] items-center justify-center rounded border border-overlay bg-surface-100 p-8">
            <div className="grid w-[380px] gap-4">
              <div className="relative mx-auto max-w-[300px]">
                <div className="absolute flex h-full w-full items-center justify-center">
                  <Loader className="animate-spin" size={20} strokeWidth={2} />
                </div>
                <Circle className="text-foreground-lighter" size={50} strokeWidth={1.5} />
              </div>
              <p className="text-center">Pausing {project.name}</p>
              <p className="text-center text-sm text-foreground-light">
                {isTakingLongerThanExpected
                  ? `This is taking longer than usual. Contact support if your project is still pausing after ${LONG_RUNNING_STATE_THRESHOLD_MINUTES} minutes.`
                  : 'Your project is being paused now. This usually takes a few minutes. While paused, your data stays safe, and you can turn the project back on anytime.'}
              </p>
              {isTakingLongerThanExpected && (
                <div className="flex justify-center">
                  <Button asChild type="default">
                    <SupportLink
                      queryParams={{
                        category: SupportCategories.DATABASE_UNRESPONSIVE,
                        projectRef: project.ref,
                        subject: 'Project stuck in pausing state',
                        message: `Project "${project.name}" has remained in a pausing state for over ${LONG_RUNNING_STATE_THRESHOLD_MINUTES} minutes.`,
                      }}
                    >
                      Contact support
                    </SupportLink>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
