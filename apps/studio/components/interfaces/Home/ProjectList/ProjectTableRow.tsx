import { Github } from 'lucide-react'
import { useRouter } from 'next/router'
import InlineSVG from 'react-inlinesvg'

import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { OrgProject } from 'data/projects/org-projects-infinite-query'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { BASE_PATH } from 'lib/constants'
import { Organization } from 'types'
import { TableCell, TableRow } from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'

export interface ProjectTableRowProps {
  project: OrgProject
  organization?: Organization
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  vercelIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
}

export const ProjectTableRow = ({
  project,
  organization,
  rewriteHref,
  githubIntegration,
  vercelIntegration,
  resourceWarnings,
}: ProjectTableRowProps) => {
  const router = useRouter()
  const { name, ref: projectRef } = project
  const projectStatus = inferProjectStatus(project.status)

  const url = rewriteHref ?? `/project/${project.ref}`
  const isGithubIntegrated = githubIntegration !== undefined
  const isVercelIntegrated = vercelIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined

  const infraInformation = project.databases.find((x) => x.identifier === project.ref)

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
          </div>
          {(isGithubIntegrated || isVercelIntegrated) && (
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
            <ComputeBadgeWrapper
              project={{
                ref: project.ref,
                organization_slug: organization?.slug,
                cloud_provider: infraInformation?.cloud_provider,
                infra_compute_size: infraInformation?.infra_compute_size,
              }}
            />
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
