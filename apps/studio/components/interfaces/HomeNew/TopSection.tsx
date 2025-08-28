import Link from 'next/link'

import ActivityStats from 'components/interfaces/HomeNew/ActivityStats'
import { ReactFlowProvider } from 'reactflow'
import { useState } from 'react'
import { SchemaGraph } from 'components/interfaces/Database/Schemas/SchemaGraph'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import { InlineLink } from 'components/ui/InlineLink'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import { cn, Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

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
  isPaused,
}: TopSectionProps) => {
  const [graphLoaded, setGraphLoaded] = useState(false)

  return (
    <div className="px-8">
      <div className="mx-auto max-w-7xl flex flex-col gap-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 py-16 md:p-0 w-full items-center">
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
            <div
              className={cn(
                'w-full h-[400px] md:h-[600px] overflow-hidden flex flex-col relative',
                graphLoaded ? 'cursor-default' : 'cursor-move opacity-0'
              )}
            >
              <ReactFlowProvider>
                <SchemaGraph hideUI onLoad={() => setGraphLoaded(true)} />
              </ReactFlowProvider>
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r from-background-surface-75 to-transparent pointer-events-none transition-all duration-700 ease-out ${
                  graphLoaded ? 'w-32' : 'w-[200%]'
                }`}
              />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background-surface-75 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background-surface-75 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
        <ProjectUpgradeFailedBanner />
        {isPaused && <ProjectPausedState />}
      </div>
    </div>
  )
}

export default TopSection
