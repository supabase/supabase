import { Badge, IconAlertTriangle, IconLoader, IconPauseCircle } from 'ui'

import CardButton from 'components/ui/CardButton'
import { useProjectReadOnlyStatusQuery } from 'data/projects/project-readonly-status-query'
import { PROJECT_STATUS } from 'lib/constants'
import { Project } from 'types'

export interface ProjectCardProps {
  project: Project
  rewriteHref?: string
}

const ProjectCard = ({ project, rewriteHref }: ProjectCardProps) => {
  const { name, ref: projectRef } = project
  const desc = `${project.cloud_provider} | ${project.region}`

  const { data: readonlyStatus } = useProjectReadOnlyStatusQuery({ projectRef })

  // Project status should supersede is read only status
  const isHealthy = project.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isPausing =
    project.status === PROJECT_STATUS.GOING_DOWN || project.status === PROJECT_STATUS.PAUSING
  const isPaused = project.status === PROJECT_STATUS.INACTIVE
  const isRestoring = project.status === PROJECT_STATUS.RESTORING
  const isReadonly = readonlyStatus?.enabled ?? false

  return (
    <li className="col-span-1">
      <CardButton
        linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
        title={
          <div className="flex w-full flex-row justify-between gap-1">
            <span className="flex-shrink truncate">{name}</span>
          </div>
        }
        footer={
          <div className="flex items-end justify-between">
            <span className="text-sm lowercase text-scale-1000">{desc}</span>

            {isHealthy && isReadonly && (
              <div className="grow text-right">
                <Badge color="yellow">
                  <div className="flex items-center gap-2">
                    <IconAlertTriangle size={14} strokeWidth={2} />
                    <span className="truncate">Readonly mode enabled</span>
                  </div>
                </Badge>
              </div>
            )}

            {isRestoring && (
              <div className="grow text-right">
                <Badge color="brand">
                  <div className="flex items-center gap-2">
                    <IconLoader className="animate-spin" size={14} strokeWidth={2} />
                    <span className="truncate">Restoring</span>
                  </div>
                </Badge>
              </div>
            )}

            {isPausing && (
              <div className="grow text-right">
                <Badge color="scale">
                  <div className="flex items-center gap-2">
                    <IconLoader className="animate-spin" size={14} strokeWidth={2} />
                    <span className="truncate">Pausing</span>
                  </div>
                </Badge>
              </div>
            )}

            {isPaused && (
              <div className="grow text-right">
                <Badge color="scale">
                  <div className="flex items-center gap-2">
                    <IconPauseCircle size={14} strokeWidth={2} />
                    <span className="truncate">Paused</span>
                  </div>
                </Badge>
              </div>
            )}
          </div>
        }
      />
    </li>
  )
}

export default ProjectCard
