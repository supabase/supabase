import {
  Badge,
  IconAlertTriangle,
  IconGitBranch,
  IconGitHub,
  IconLoader,
  IconPauseCircle,
  IconTriangle,
} from 'ui'

import CardButton from 'components/ui/CardButton'
import { useProjectReadOnlyStatus } from 'hooks/misc/useProjectReadOnlyStatus'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { Project } from 'types'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'

export interface ProjectCardProps {
  project: Project
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  vercelIntegration?: IntegrationProjectConnection
}

const ProjectCard = ({
  project,
  rewriteHref,
  githubIntegration,
  vercelIntegration,
}: ProjectCardProps) => {
  const { name, ref: projectRef } = project
  const desc = `${project.cloud_provider} | ${project.region}`

  const isReadonly = useProjectReadOnlyStatus(projectRef)
  const isBranchingEnabled = project.preview_branch_refs.length > 0
  const isGithubIntegrated = githubIntegration !== undefined
  const isVercelIntegrated = vercelIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined

  // Project status should supersede is read only status
  const isHealthy = project.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isPausing =
    project.status === PROJECT_STATUS.GOING_DOWN || project.status === PROJECT_STATUS.PAUSING
  const isPaused = project.status === PROJECT_STATUS.INACTIVE
  const isRestoring = project.status === PROJECT_STATUS.RESTORING

  return (
    <li className="col-span-1 list-none">
      <CardButton
        linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
        title={
          <div className="w-full justify-between space-y-1">
            <p className="flex-shrink truncate">{name}</p>
            <div className="flex items-center space-x-1.5">
              {isVercelIntegrated && (
                <div className="w-fit p-1 border rounded-md flex items-center border-scale-600">
                  <img
                    src={`${BASE_PATH}/img/icons/vercel-icon.svg`}
                    alt="Vercel Icon"
                    className="w-3"
                  />
                </div>
              )}
              {isBranchingEnabled && (
                <div className="w-fit p-1 border rounded-md flex items-center border-scale-600">
                  <IconGitBranch size={12} strokeWidth={1.5} />
                </div>
              )}
              {isGithubIntegrated && (
                <>
                  <div className="w-fit p-1 border rounded-md flex items-center border-scale-600">
                    <IconGitHub size={12} strokeWidth={1.5} />
                  </div>
                  <p className="text-xs !ml-2 text-scale-1100">{githubRepository}</p>
                </>
              )}
            </div>
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
                    <span className="truncate">Read-only mode</span>
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
