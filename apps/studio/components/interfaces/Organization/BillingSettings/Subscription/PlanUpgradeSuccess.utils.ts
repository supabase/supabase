import { getComputeSize, type OrgProject } from '@/data/projects/org-projects-infinite-query'
import { PROJECT_STATUS } from '@/lib/constants'

/** Paid plans that land on the post-upgrade screen. */
export type UpgradedPlanId = 'pro' | 'team'

/** Placeholder project ref that sends the user through the project picker before the page. */
export const ANY_PROJECT_REF = '_'

const isActive = (project: OrgProject) => project.status === PROJECT_STATUS.ACTIVE_HEALTHY

/**
 * Running projects still on Nano compute. Paid plans bill Nano at the Micro rate, so moving
 * them to Micro adds resources at no extra cost.
 */
export const getNanoProjects = (projects: OrgProject[]) =>
  projects.filter((project) => isActive(project) && getComputeSize(project) === 'nano')

/**
 * The project that project-scoped links should open. With exactly one running project the
 * link goes straight to it; otherwise the placeholder lets the user pick one.
 */
export const getLinkProjectRef = (projects: OrgProject[]) => {
  const activeProjects = projects.filter(isActive)
  return activeProjects.length === 1 ? activeProjects[0].ref : ANY_PROJECT_REF
}
