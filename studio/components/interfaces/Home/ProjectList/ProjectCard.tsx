import { FC } from 'react'

import { Badge, Button, IconClock } from '@supabase/ui'
import { Project } from 'types'
import CardButton from 'components/ui/CardButton'

interface Props {
  project: Project
  paused: boolean
  onSelectRestore?: () => void
  onSelectDelete?: () => void
  rewriteHref?: string
}

const ProjectCard: FC<Props> = ({
  project,
  paused,
  onSelectRestore,
  onSelectDelete,
  rewriteHref,
}) => {
  const { name, ref: projectRef, status } = project
  const desc = `${project.cloud_provider} | ${project.region}`

  return (
    <li className="col-span-1">
      <CardButton
        linkHref={rewriteHref ? rewriteHref : paused ? '' : `/project/${projectRef}`}
        title={
          <div className="flex flex-row gap-1 w-full justify-between w-full">
            <span className="truncate flex-shrink">{name}</span>
            {paused && (
              <div className="grow text-right">
                <Badge color="scale">
                  <div className="flex items-center gap-2">
                    <IconClock size={14} strokeWidth={2} />
                    <span className="truncate">Project paused</span>
                  </div>
                </Badge>
              </div>
            )}
          </div>
        }
        description={''}
        footer={
          <div className="lowercase flex justify-between items-end">
            <span className="text-sm text-scale-900">{desc}</span>
            {paused && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="tiny"
                    type="primary"
                    onClick={() => onSelectRestore && onSelectRestore()}
                  >
                    Restore
                  </Button>
                  <Button
                    size="tiny"
                    type="default"
                    onClick={() => onSelectDelete && onSelectDelete()}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        }
      ></CardButton>
    </li>
  )
}

export default ProjectCard
