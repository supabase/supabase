import { IconGitBranch, IconGitHub } from 'ui'

import CardButton from 'components/ui/CardButton'
import { BASE_PATH } from 'lib/constants'
import { Project } from 'types'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { ResourceWarning } from 'data/usage/resource-warnings-query'
import { ProjectCardStatus } from './ProjectCardStatus'
import { inferProjectStatus } from './ProjectCard.utils'

export interface ProjectCardProps {
  project: Project
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  vercelIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
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
  const projectStatus = inferProjectStatus(project)

  return (
    <li className="col-span-1 list-none">
      <CardButton
        linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
        className="h-44 !px-0 group"
        title={
          <div className="w-full justify-between space-y-1.5 px-6">
            <p className="flex-shrink truncate text-base">{name}</p>
            <span className="text-sm lowercase text-scale-1000">{desc}</span>
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
            <ProjectCardStatus projectStatus={projectStatus} resourceWarnings={resourceWarnings} />
          </div>
        }
      ></CardButton>
    </li>
  )
}

export default ProjectCard
