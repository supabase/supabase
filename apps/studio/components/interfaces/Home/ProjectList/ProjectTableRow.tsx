import { Github, MoreVertical, Trash, Copy, Check } from 'lucide-react'
import { useRouter } from 'next/router'
import InlineSVG from 'react-inlinesvg'
import { useState } from 'react'

import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { getComputeSize, OrgProject } from 'data/projects/org-projects-infinite-query'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { BASE_PATH } from 'lib/constants'
import { createNavigationHandler } from 'lib/navigation'
import type { Organization } from 'types'
import {
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenu,
  TableCell,
  TableRow,
  Button,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'
import { DeleteProjectModal } from 'components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectModal'
import { toast } from 'sonner'
import { copyToClipboard } from 'ui'

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const url = rewriteHref ?? `/project/${project.ref}`
  const isGithubIntegrated = githubIntegration !== undefined
  const isVercelIntegrated = vercelIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined
  const handleNavigation = createNavigationHandler(url, router)

  const handleCopyProjectRef = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    copyToClipboard(projectRef)
    setIsCopied(true)
    toast.success('Copied project ID to clipboard')
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-surface-200 inset-focus"
        onClick={handleNavigation}
        onAuxClick={handleNavigation}
        onKeyDown={handleNavigation}
        tabIndex={0}
      >
        <TableCell>
          <div className="flex flex-col gap-y-2">
            <div>
              <h5 className="text-sm">{name}</h5>
              <button
                tabIndex={0}
                onClick={handleCopyProjectRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCopyProjectRef(e)
                  }
                }}
                className="inline-flex items-center gap-x-1 cursor-pointer border border-transparent border-dashed rounded transition-colors hover:bg-surface-100 hover:border hover:border-strong group font-mono text-xs text-foreground-lighter hover:text-foreground-light px-1 -ml-1"
              >
                {projectRef}
                {isCopied ? (
                  <Check size={12} strokeWidth={1.25} className="text-brand" />
                ) : (
                  <Copy
                    size={12}
                    strokeWidth={1.25}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </button>
            </div>
            {(isGithubIntegrated || isVercelIntegrated) && (
              <div className="flex items-center gap-x-1.5">
                {isVercelIntegrated && (
                  <div className="bg-surface-100 w-5 h-5 p-1 border border-strong rounded-md flex items-center text-black dark:text-white">
                    <InlineSVG
                      src={`${BASE_PATH}/img/icons/vercel-icon.svg`}
                      title="Vercel Icon"
                      className="w-3"
                    />
                  </div>
                )}
                {isGithubIntegrated && (
                  <div className="bg-surface-100 flex items-center gap-x-0.5 h-5 pr-1 border border-strong rounded-md">
                    <div className="w-5 h-5 p-1 flex items-center">
                      <Github size={12} strokeWidth={1.5} />
                    </div>
                    {githubRepository && (
                      <p className="text-xs text-foreground-light truncate">{githubRepository}</p>
                    )}
                  </div>
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
                slug={organization?.slug}
                projectRef={project.ref}
                cloudProvider={project.cloud_provider}
                computeSize={getComputeSize(project)}
              />
            ) : (
              <span className="text-xs text-foreground-muted">–</span>
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
        <TableCell className="text-right">
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="default"
                  icon={<MoreVertical />}
                  aria-label="More actions"
                  className="w-7"
                  onClick={(e) => e.stopPropagation()}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="gap-x-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDeleteModalOpen(true)
                  }}
                >
                  <Trash size={14} />
                  <span>Delete project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      <DeleteProjectModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        project={project}
        organization={organization}
      />
    </>
  )
}
