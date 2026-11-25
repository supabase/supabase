import { getComputeSize, type OrgProject } from '@/data/projects/org-projects-infinite-query'
import { PROJECT_STATUS } from '@/lib/constants'

/** Paid plans that land on the post-upgrade screen. */
export type UpgradedPlanId = 'pro' | 'team'

/** Placeholder project ref that sends the user through the project picker before the page. */
export const ANY_PROJECT_REF = '_'

const isActive = (project: OrgProject) => project.status === PROJECT_STATUS.ACTIVE_HEALTHY

export interface MicroUpgradeRow {
  project: OrgProject
  /** The project is restarting onto its new compute size. */
  isUpgrading: boolean
}

/**
 * Projects to list in the Micro upgrade card. Paid plans bill Nano at the Micro rate, so every
 * running Nano project can move to Micro at no extra cost. A project stays listed while it
 * resizes, and drops off once it is back up on Micro.
 *
 * @param upgradeRequestedRefs Projects upgraded from the card. They may already report Micro
 * while still resizing, so the Nano check alone would drop them too early.
 */
export const getMicroUpgradeRows = (
  projects: OrgProject[],
  upgradeRequestedRefs: ReadonlySet<string>
): MicroUpgradeRow[] =>
  projects.flatMap((project): MicroUpgradeRow[] => {
    const isNano = getComputeSize(project) === 'nano'
    const isResizing = project.status === PROJECT_STATUS.RESIZING

    if (isResizing && (isNano || upgradeRequestedRefs.has(project.ref))) {
      return [{ project, isUpgrading: true }]
    }
    if (isActive(project) && isNano) return [{ project, isUpgrading: false }]
    return []
  })

/**
 * The project that project-scoped links should open. With exactly one running project the
 * link goes straight to it; otherwise the placeholder lets the user pick one.
 */
export const getLinkProjectRef = (projects: OrgProject[]) => {
  const activeProjects = projects.filter(isActive)
  return activeProjects.length === 1 ? activeProjects[0].ref : ANY_PROJECT_REF
}
