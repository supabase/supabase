import { getProjectDetail } from './project-detail-query'
import type { ProjectsService } from './projects-service'

export const projectsServiceLive: ProjectsService = {
  getProjectDetail,
}
