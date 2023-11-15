import CardButton from 'components/ui/CardButton'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { ResourceWarning } from 'data/usage/resource-warnings-query'
import { BASE_PATH } from 'lib/constants'
import { GitBranch, Github } from 'lucide-react'
import { Project } from 'types'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'

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
    <li className="list-none">
      <CardButton
        linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
        className="h-44 !px-0 group pt-5 pb-0"
        title={
          <div className="w-full justify-between space-y-1.5 px-5">
            <p className="flex-shrink truncate text-sm pr-4">{name}</p>
            <span className="text-sm lowercase text-foreground-light">{desc}</span>
            <div className="flex items-center space-x-1.5">
              {isVercelIntegrated && (
                <div className="w-fit p-1 border rounded-md flex items-center border-controler">
                  <img
                    src={`${BASE_PATH}/img/icons/vercel-icon.svg`}
                    alt="Vercel Icon"
                    className="w-3"
                  />
                </div>
              )}
              {isBranchingEnabled && (
                <div className="w-fit p-1 border rounded-md flex items-center border-controler">
                  <GitBranch size={12} strokeWidth={1.5} />
                </div>
              )}
              {isGithubIntegrated && (
                <>
                  <div className="w-fit p-1 border rounded-md flex items-center border-controler">
                    <Github size={12} strokeWidth={1.5} />
                  </div>
                  <p className="text-xs !ml-2 text-foreground-light">{githubRepository}</p>
                </>
              )}
            </div>
          </div>
        }
        footer={
          <ProjectCardStatus projectStatus={projectStatus} resourceWarnings={resourceWarnings} />
        }
      />
    </li>
  )
}

export default ProjectCard
