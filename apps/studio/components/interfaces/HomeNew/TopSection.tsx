import Link from 'next/link'

import { ActivityStats } from 'components/interfaces/HomeNew/ActivityStats'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import { InlineLink } from 'components/ui/InlineLink'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import { DOCS_URL } from 'lib/constants'
import { ReactFlowProvider } from 'reactflow'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { InstanceConfiguration } from '../Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'

interface TopSectionProps {
  projectName: string
  isMainBranch?: boolean
  parentProject?: { ref?: string; name?: string } | null
  isOrioleDb?: boolean
  project: any
  organization: any
  projectRef?: string
  isPaused: boolean
}

export const TopSection = ({
  projectName,
  isMainBranch,
  parentProject,
  isOrioleDb,
  project,
  organization,
  isPaused,
}: TopSectionProps) => {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-0 w-full items-center">
        <div className="flex flex-col">
          <div className="flex flex-row flex-wrap items-center gap-4 w-full">
            <div>
              {!isMainBranch && (
                <Link
                  href={`/project/${parentProject?.ref}`}
                  className="text-sm text-foreground-light"
                >
                  {parentProject?.name}
                </Link>
              )}
              <h1 className="text-3xl">{projectName}</h1>
            </div>
            <div className="flex items-center gap-x-2">
              {isOrioleDb && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="warning">OrioleDB</Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-80 text-center">
                    This project is using Postgres with OrioleDB which is currently in preview and
                    not suitable for production workloads. View our{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/orioledb`}>
                      documentation
                    </InlineLink>{' '}
                    for all limitations.
                  </TooltipContent>
                </Tooltip>
              )}
              <ComputeBadgeWrapper
                project={{
                  ref: project?.ref,
                  organization_slug: organization?.slug,
                  cloud_provider: project?.cloud_provider,
                  infra_compute_size: project?.infra_compute_size,
                }}
              />
            </div>
          </div>
          <div className="mt-8">
            <ActivityStats />
          </div>
        </div>
        <div>
          <div
            className={cn(
              'w-full h-[400px] md:h-[500px] border border-muted rounded-md overflow-hidden flex flex-col relative'
            )}
          >
            <ReactFlowProvider>
              <InstanceConfiguration diagramOnly />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
      <ProjectUpgradeFailedBanner />
      {isPaused && <ProjectPausedState />}
    </div>
  )
}
