import type { Project } from './project-detail-query'

export interface ProjectsService {
  getProjectDetail: (params: { ref?: string }, signal?: AbortSignal) => Promise<Project>
}
