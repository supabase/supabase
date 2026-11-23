import { ArrowRightIcon, DatabaseIcon, TargetIcon, WorkflowIcon } from 'lucide-react'
import { AWS_REGIONS } from 'shared-data'
import { cn } from 'ui'

import { DestinationLogo } from './DestinationLogo'
import type { ReplicationDestinationType } from './ReplicationDiagram/Nodes.utils'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const PipelineFlow = ({
  pipelineRegion,
  isRunning,
  destination,
  destinationType,
}: {
  pipelineRegion?: string
  isRunning: boolean
  destination: string
  destinationType?: ReplicationDestinationType
}) => {
  const { data: project } = useSelectedProjectQuery()
  const sourceRegion = Object.values(AWS_REGIONS).find(({ code }) => code === project?.region)
  const cards = [
    {
      label: 'Source database',
      icon: DatabaseIcon,
      content: (
        <>
          Primary database
          {sourceRegion && <p className="text-foreground-light">{sourceRegion.displayName}</p>}
        </>
      ),
    },
    {
      label: 'Pipeline',
      icon: WorkflowIcon,
      content: <>{pipelineRegion && <p className="text-foreground-light">{pipelineRegion}</p>}</>,
    },
    {
      label: 'Destination',
      icon: TargetIcon,
      content: (
        <>
          <div className="flex items-center gap-2">
            {destinationType && destinationType !== 'Unknown' && (
              <DestinationLogo type={destinationType} />
            )}
            <span>{destinationType ?? 'External destination'}</span>
          </div>
          <p className="break-all text-foreground-light">{destination}</p>
        </>
      ),
    },
  ]

  return (
    <ol
      aria-label="Pipeline data flow"
      className="flex flex-col gap-2 md:flex-row md:items-stretch"
    >
      {cards.map(({ label, icon: Icon, content }, index) => (
        <li key={label} className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row">
          {index > 0 && (
            <ArrowRightIcon
              aria-hidden
              size={16}
              className={cn(
                'shrink-0 self-center rotate-90 md:rotate-0',
                isRunning ? 'text-foreground-light' : 'text-foreground-muted'
              )}
            />
          )}
          <div className="min-w-0 flex-1 rounded-lg border bg-surface-75">
            <h2 className="flex items-center gap-2 border-b px-4 py-2 text-sm font-medium">
              <Icon size={16} className="text-foreground-light" aria-hidden />
              {label}
            </h2>
            <div className="space-y-1 p-4 text-sm">{content}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}
