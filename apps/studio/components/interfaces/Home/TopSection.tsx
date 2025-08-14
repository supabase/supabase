import Link from 'next/link'
import ActivityStats from 'components/interfaces/Home/ActivityStats'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import { InlineLink } from 'components/ui/InlineLink'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import InstanceConfiguration from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'

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

const TopSection = ({
  projectName,
  isMainBranch,
  parentProject,
  isOrioleDb,
  project,
  organization,
  projectRef,
  isPaused,
}: TopSectionProps) => {
  return (
    <div className="pt-12 px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-32 w-full items-center">
          <div className="flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end gap-3 w-full">
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
              <div className="flex items-center gap-x-2 mb-1">
                {isOrioleDb && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="warning">OrioleDB</Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" className="max-w-80 text-center">
                      This project is using Postgres with OrioleDB which is currently in preview and
                      not suitable for production workloads. View our{' '}
                      <InlineLink href="https://supabase.com/docs/guides/database/orioledb">
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
            <Link href={`/project/${projectRef}/settings/infrastructure`}>
              <div className="w-full h-[400px] border rounded-md overflow-hidden cursor-pointer hover:bg">
                <div
                  className="h-[500px] scale-[0.8] origin-top-left pointer-events-none"
                  style={{ width: 'calc(100% / 0.8)' }}
                >
                  <InstanceConfiguration />
                </div>
              </div>
            </Link>
          </div>
        </div>
        <ProjectUpgradeFailedBanner />
        {isPaused && <ProjectPausedState />}
      </div>
    </div>
  )
}

export default TopSection
