import CardButton from 'components/ui/CardButton'
import { PROJECT_STATUS } from 'lib/constants'
import { Project } from 'types'
import { Badge, IconLoader, IconPauseCircle } from 'ui'

export interface ProjectCardProps {
  project: Project
  rewriteHref?: string
}

const ProjectCard = ({ project, rewriteHref }: ProjectCardProps) => {
  const { name, ref: projectRef } = project
  const desc = `${project.cloud_provider} | ${project.region}`

  const isPausing =
    project.status === PROJECT_STATUS.GOING_DOWN || project.status === PROJECT_STATUS.PAUSING
  const isPaused = project.status === PROJECT_STATUS.INACTIVE
  const isRestoring = project.status === PROJECT_STATUS.RESTORING

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
            {isRestoring ? (
              <div className="grow text-right">
                <Badge color="brand">
                  <div className="flex items-center gap-2">
                    <IconLoader className="animate-spin" size={14} strokeWidth={2} />
                    <span className="truncate">Restoring</span>
                  </div>
                </Badge>
              </div>
            ) : isPausing ? (
              <div className="grow text-right">
                <Badge color="scale">
                  <div className="flex items-center gap-2">
                    <IconLoader className="animate-spin" size={14} strokeWidth={2} />
                    <span className="truncate">Pausing</span>
                  </div>
                </Badge>
              </div>
            ) : isPaused ? (
              <div className="grow text-right">
                <Badge color="scale">
                  <div className="flex items-center gap-2">
                    <IconPauseCircle size={14} strokeWidth={2} />
                    <span className="truncate">Paused</span>
                  </div>
                </Badge>
              </div>
            ) : (
              <></>
            )}
          </div>
        }
      />
    </li>
  )
}

export default ProjectCard
