import { SupportCategories } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useInvalidateProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { Project, useInvalidateProjectDetailsQuery } from 'data/projects/project-detail-query'
import { useProjectStatusQuery } from 'data/projects/project-status-query'
import { PROJECT_STATUS } from 'lib/constants'
import {
  clearPersistedTransitionStartTime,
  FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES,
  getPersistedTransitionStartTime,
  getRemainingTransitionTimeMs,
  hoursToMilliseconds,
  MAX_PERSISTED_TRANSITION_AGE_HOURS,
  minutesToMilliseconds,
} from 'lib/project-transition-state'
import { Circle, Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button } from 'ui'

const LONG_RUNNING_STATE_THRESHOLD_MINUTES = FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES
const LONG_RUNNING_STATE_THRESHOLD_MS = minutesToMilliseconds(LONG_RUNNING_STATE_THRESHOLD_MINUTES)
const MAX_PERSISTED_TRANSITION_AGE_MS = hoursToMilliseconds(MAX_PERSISTED_TRANSITION_AGE_HOURS)

export interface PausingStateProps {
  project: Project
}

export const PausingState = ({ project }: PausingStateProps) => {
  const { ref } = useParams()
  const [startPolling, setStartPolling] = useState(false)
  const [isTakingLongerThanExpected, setIsTakingLongerThanExpected] = useState(false)
  const pauseStateStartStorageKey = ref ? LOCAL_STORAGE_KEYS.PROJECT_PAUSING_STARTED_AT(ref) : null

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

  useEffect(() => {
    const startTime = pauseStateStartStorageKey
      ? getPersistedTransitionStartTime(
          pauseStateStartStorageKey,
          Date.now(),
          MAX_PERSISTED_TRANSITION_AGE_MS
        )
      : Date.now()
    const remainingThresholdMs = getRemainingTransitionTimeMs({
      startTimeMs: startTime,
      thresholdMs: LONG_RUNNING_STATE_THRESHOLD_MS,
    })

    if (remainingThresholdMs === 0) {
      setIsTakingLongerThanExpected(true)
      return
    }

    setIsTakingLongerThanExpected(false)
    const timeoutId = setTimeout(() => setIsTakingLongerThanExpected(true), remainingThresholdMs)
    return () => clearTimeout(timeoutId)
  }, [pauseStateStartStorageKey])

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
