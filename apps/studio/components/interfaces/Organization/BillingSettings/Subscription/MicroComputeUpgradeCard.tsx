import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, CpuIcon } from 'lucide-react'
import { Badge, Button, Card, CardContent } from 'ui'

import type { UpgradedPlanId } from './PlanUpgradeSuccess.utils'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { DOCS_URL, INSTANCE_MICRO_SPECS, INSTANCE_NANO_SPECS } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

interface MicroComputeUpgradeCardProps {
  /** The paid plan the organization just upgraded to. */
  planId: UpgradedPlanId
  /** Running projects still on Nano compute. */
  projects: OrgProject[]
}

/**
 * Paid plans bill Nano compute at the Micro rate, so every Nano project left behind after an
 * upgrade pays for resources it doesn't get. Lists those projects with a direct link to each
 * project's Infrastructure settings.
 */
export const MicroComputeUpgradeCard = ({ planId, projects }: MicroComputeUpgradeCardProps) => {
  const track = useTrack()
  const projectCount = projects.length
  const projectNoun = projectCount === 1 ? 'project runs' : 'projects run'

  return (
    <Card className="w-full border-brand-500/50">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-200 text-brand"
          aria-hidden="true"
        >
          <CpuIcon size={16} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base text-foreground">Upgrade to Micro compute at no extra cost</h2>
          <p className="text-sm text-foreground-light">
            {projectCount} {projectNoun} on Nano compute, which your plan bills at the Micro rate.
            Micro doubles memory ({INSTANCE_NANO_SPECS.memory_gb} GB to{' '}
            {INSTANCE_MICRO_SPECS.memory_gb} GB) and direct database connections (
            {INSTANCE_NANO_SPECS.connections_direct} to {INSTANCE_MICRO_SPECS.connections_direct}).
            Each project restarts briefly during the upgrade.{' '}
            <a
              href={`${DOCS_URL}/guides/platform/compute-and-disk`}
              target="_blank"
              rel="noreferrer"
              className="underline transition-colors hover:text-foreground"
            >
              Learn about compute sizes
            </a>
          </p>
        </div>
      </CardContent>
      <ul>
        {projects.map((project) => (
          <li key={project.ref}>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm text-foreground" translate="no">
                  {project.name}
                </span>
                <Badge>Nano</Badge>
              </div>
              <Button asChild variant="default" iconRight={<ArrowRightIcon />}>
                <Link
                  to="/project/$ref/settings/infrastructure"
                  params={{ ref: project.ref }}
                  onClick={() =>
                    track(
                      'plan_upgraded_micro_compute_upgrade_clicked',
                      { planId, nanoProjectCount: projectCount },
                      // The screen sits on an org page, so name the project being upgraded.
                      { project: project.ref }
                    )
                  }
                >
                  Upgrade to Micro <span className="sr-only">for {project.name}</span>
                </Link>
              </Button>
            </CardContent>
          </li>
        ))}
      </ul>
    </Card>
  )
}
