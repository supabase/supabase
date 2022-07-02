import { FC } from 'react'
import { Badge, IconLoader, IconPauseCircle, IconAlertCircle } from '@supabase/ui'

import { Project } from 'types'
import CardButton from 'components/ui/CardButton'
import { PROJECT_STATUS } from 'lib/constants'

interface Props {
  project: Project
  rewriteHref?: string
}

const ProjectCard: FC<Props> = ({ project, rewriteHref }) => {
  const { name, ref: projectRef } = project
  const desc = `${project.cloud_provider} | ${project.region}`

  const isPausing = project.status === PROJECT_STATUS.GOING_DOWN
  const isPaused = project.status === PROJECT_STATUS.INACTIVE
  const isRestoring = project.status === PROJECT_STATUS.RESTORING
  const projectIsOverLimits = true

  return (
    <li className="col-span-1">
      <CardButton
        linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
        title={
          <div className="flex w-full flex-row justify-between gap-1">
            <span className="flex-shrink truncate">{name}</span>
          </div>
        }
        description={''}
        footer={
          <div className="flex items-end justify-between">
            <span className="text-scale-900 text-sm lowercase">{desc}</span>
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
            ) : projectIsOverLimits ? (
              // [Terry] I think just putting this check at the end is ok here
              // if a project is paused / pausing / restoring that will show first
              // before this state
              <div className="grow text-right">
                <Badge color="red">
                  <div className="flex items-center gap-2">
                    <IconAlertCircle size={14} strokeWidth={2} />
                    <span className="truncate">Over Limits</span>
                  </div>
                </Badge>
              </div>
            ) : (
              <></>
            )}
          </div>
        }
      ></CardButton>
    </li>
  )
}

export default ProjectCard
