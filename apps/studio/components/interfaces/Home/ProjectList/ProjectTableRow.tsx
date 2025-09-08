import { Github } from 'lucide-react'
import { useRouter } from 'next/router'
import InlineSVG from 'react-inlinesvg'

import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import type { ProjectInfo } from 'data/projects/projects-query'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { BASE_PATH } from 'lib/constants'
import { TableCell, TableRow } from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'
import { ProjectListItemStatus } from './ProjectListItemStatus'
import { useProjectIssueCounts } from './useProjectIssueCounts'

export interface ProjectTableRowProps {
  project: ProjectInfo
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  vercelIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
}

export const ProjectTableRow = ({
  project,
  rewriteHref,
  githubIntegration,
  vercelIntegration,
  resourceWarnings,
}: ProjectTableRowProps) => {
  const router = useRouter()
  const { name, ref: projectRef } = project
  const projectStatus = inferProjectStatus(project)

  // Get issue counts using the shared hook
  const issueCounts = useProjectIssueCounts(projectRef, project.status !== 'INACTIVE')

  const url = rewriteHref ?? `/project/${project.ref}`
  const isBranchingEnabled = project.preview_branch_refs?.length > 0
  const isGithubIntegrated = githubIntegration !== undefined
  const isVercelIntegrated = vercelIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined

  return (
    <TableRow
      className="cursor-pointer hover:bg-surface-200"
      onClick={(event) => {
        if (event.metaKey) {
          window.open(`${BASE_PATH}/${url}`, '_blank')
        } else {
          router.push(url)
        }
      }}
    >
      <TableCell>
        <div className="flex flex-col gap-y-1">
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-foreground-lighter">ID: {projectRef}</p>
            <ProjectListItemStatus
              totalIssues={issueCounts.totalIssues}
              hasErrors={issueCounts.hasErrors}
              hasWarnings={issueCounts.hasWarnings}
              renderMode="inline"
            />
          </div>
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
                    <span className="text-xs text-foreground-light truncate max-w-64">
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
        <span className="lowercase text-sm text-foreground-light">
          {project.cloud_provider} | {project.region || 'N/A'}
        </span>
      </TableCell>
      <TableCell>
        {project.inserted_at ? (
          <TimestampInfo
            className="text-sm text-foreground-light"
            utcTimestamp={project.inserted_at}
          />
        ) : (
          <span className="text-sm text-foreground-light">N/A</span>
        )}
      </TableCell>
    </TableRow>
  )
}
