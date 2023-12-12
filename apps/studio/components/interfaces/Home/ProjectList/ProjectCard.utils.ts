import { ProjectInfo } from 'data/projects/projects-query'
import { PROJECT_STATUS } from 'lib/constants'

export const inferProjectStatus = (project: ProjectInfo) => {
  let status = undefined
  switch (project.status) {
    case PROJECT_STATUS.ACTIVE_HEALTHY:
      status = 'isHealthy'
      break
    case PROJECT_STATUS.GOING_DOWN:
    case PROJECT_STATUS.PAUSING:
      status = 'isPausing'
      break
    case PROJECT_STATUS.INACTIVE:
      status = 'isPaused'
      break
    case PROJECT_STATUS.RESTORING:
      status = 'isRestoring'
      break
    case PROJECT_STATUS.UNKNOWN:
    case PROJECT_STATUS.COMING_UP:
      status = 'isComingUp'
      break
  }
  return status as InferredProjectStatus
}

export type InferredProjectStatus =
  | 'isHealthy'
  | 'isPausing'
  | 'isPaused'
  | 'isRestoring'
  | 'isComingUp'
  | undefined
