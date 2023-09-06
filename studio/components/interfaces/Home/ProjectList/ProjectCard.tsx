import { IconGitBranch, IconGitHub } from 'ui'

import CardButton from 'components/ui/CardButton'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { Project } from 'types'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { ResourceWarning } from 'data/usage/resource-warnings-query'
import { useFlag } from 'hooks'
import { ProjectCardStatus } from './ProjectCardStatus'

export interface ProjectCardProps {
  project: Project
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  vercelIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
}

const getProjetStatus = (project: Project) => {
  let status
  switch (project.status) {
    case PROJECT_STATUS.ACTIVE_HEALTHY:
      status = 'isHealthy'
      break
    case PROJECT_STATUS.GOING_DOWN:
    case PROJECT_STATUS.PAUSING:
      status = 'isPausing'
      break
    case PROJECT_STATUS.INACTIVE:
      status = 'isPaused'
      break
    case PROJECT_STATUS.RESTORING:
      status = 'isRestoring'
      break
    case PROJECT_STATUS.UNKNOWN:
    case PROJECT_STATUS.COMING_UP:
      status = 'isComingUp'
      break
    default:
      status = ''
  }
  return status
}

const ProjectCard = ({
  project,
  rewriteHref,
  githubIntegration,
  vercelIntegration,
  resourceWarnings,
}: ProjectCardProps) => {
  const { name, ref: projectRef } = project
  const desc = `${project.cloud_provider} | ${project.region}`

  const isBranchingEnabled = project.preview_branch_refs.length > 0
  const isGithubIntegrated = githubIntegration !== undefined
  const isVercelIntegrated = vercelIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined
  const projectStatus = getProjetStatus(project)

  return (
    <li className="col-span-1 list-none">
      <CardButton
        linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
        containerHeightClassName="h-40"
        title={
          <div className="w-full justify-between space-y-1.5 px-6">
            <p className="flex-shrink truncate text-sm">{name}</p>
            <span className="text-xs lowercase text-scale-1000">{desc}</span>
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
          <div className="mb-[-26px]">
            {resourceWarnings && (
              <ProjectCardStatus
                projectStatus={projectStatus}
                resourceWarnings={resourceWarnings}
              />
            )}
          </div>
        }
      ></CardButton>
    </li>
  )
}

export default ProjectCard
