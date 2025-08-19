import { Github } from 'lucide-react'
import { useRouter } from 'next/router'

import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import type { ProjectInfo } from 'data/projects/projects-query'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { BASE_PATH } from 'lib/constants'
import InlineSVG from 'react-inlinesvg'
import { TableCell, TableRow } from 'ui'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'

export interface ProjectTableRowProps {
  project: ProjectInfo
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  vercelIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
}

const ProjectTableRow = ({
  project,
  rewriteHref,
  githubIntegration,
  vercelIntegration,
  resourceWarnings,
}: ProjectTableRowProps) => {
  const router = useRouter()
  const { name, ref: projectRef } = project
  const projectStatus = inferProjectStatus(project)

  const isBranchingEnabled = project.preview_branch_refs?.length > 0
  const isGithubIntegrated = githubIntegration !== undefined
  const isVercelIntegrated = vercelIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined


  return (
    <TableRow
      className="cursor-pointer hover:bg-surface-100"
      onClick={() => {
        rewriteHref ? router.push(rewriteHref) : router.push(`/project/${project.ref}`)
      }}
    >
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{name}</p>
          <p className="text-xs text-foreground-light">{projectRef}</p>
          {(isGithubIntegrated || isVercelIntegrated || isBranchingEnabled) && (
            <div className="flex items-center gap-x-2">
              {isVercelIntegrated && (
                <div className="w-fit p-1 border rounded-md flex items-center text-black dark:text-white">
                  <InlineSVG
                    src={`${BASE_PATH}/img/icons/vercel-icon.svg`}
                    title="Vercel Icon"
                    className="w-3"
                  />
                </div>
              )}
              {isGithubIntegrated && (
                <>
                  <div className="w-fit p-1 border rounded-md flex items-center">
                    <Github size={12} strokeWidth={1.5} />
                  </div>
                  {githubRepository && (
                    <span className="text-xs text-foreground-light truncate max-w-32">
                      {githubRepository}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <ProjectCardStatus 
          projectStatus={projectStatus} 
          resourceWarnings={resourceWarnings}
          renderMode="badge"
        />
      </TableCell>
      <TableCell>
        <div className="w-fit">
          {project.status !== 'INACTIVE' ? (
            <ComputeBadgeWrapper project={project} />
          ) : (
            <span className="text-xs text-foreground-light">-</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-foreground-light">{project.region || 'N/A'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-foreground-light">
          {project.inserted_at ? new Date(project.inserted_at).toLocaleDateString() : 'N/A'}
        </span>
      </TableCell>
    </TableRow>
  )
}

export default ProjectTableRow
