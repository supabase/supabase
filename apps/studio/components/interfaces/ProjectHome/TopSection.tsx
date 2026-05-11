import { ReactFlowProvider } from '@xyflow/react'
import Link from 'next/link'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { InstanceConfiguration } from '../Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'
import { ActivityStats } from '@/components/interfaces/ProjectHome/ActivityStats'
import { ProjectConnectionPopover } from '@/components/interfaces/ProjectHome/ProjectConnectionPopover'
import { ProjectPausedState } from '@/components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { InlineLink } from '@/components/ui/InlineLink'
import { ProjectUpgradeFailedBanner } from '@/components/ui/ProjectUpgradeFailedBanner'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useIsOrioleDb, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL, PROJECT_STATUS } from '@/lib/constants'

export const TopSection = () => {
  const isOrioleDb = useIsOrioleDb()
  const { data: project } = useSelectedProjectQuery()
  const { data: parentProject } = useProjectDetailQuery({ ref: project?.parent_project_ref })

  const { data: branches } = useBranchesQuery({
    projectRef: project?.parent_project_ref ?? project?.ref,
  })

  const mainBranch = branches?.find((branch) => branch.is_default)
  const currentBranch = branches?.find((branch) => branch.project_ref === project?.ref)
  const isMainBranch = currentBranch?.name === mainBranch?.name

  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const projectName =
    currentBranch && !isMainBranch
      ? currentBranch.name
      : project?.name
        ? project.name
        : 'Welcome to your project'

  if (isPaused) {
    return <ProjectPausedState />
  }

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
              <div className="flex items-center gap-x-2">
                <h1 className="text-3xl">{projectName}</h1>
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
              </div>
              <ProjectConnectionPopover projectRef={project?.ref} />
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
    </div>
  )
}
