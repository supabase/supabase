import { Github, MoreVertical, Trash, Copy } from 'lucide-react'
import InlineSVG from 'react-inlinesvg'
import { useState } from 'react'

import CardButton from 'components/ui/CardButton'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import { DeleteProjectModal } from 'components/interfaces/Settings/General/DeleteProjectPanel/DeleteProjectModal'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { getComputeSize, OrgProject } from 'data/projects/org-projects-infinite-query'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { BASE_PATH } from 'lib/constants'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'
import type { Organization } from 'types'
import { toast } from 'sonner'
import {
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from 'ui'

export interface ProjectCardProps {
  slug?: string
  project: OrgProject
  organization?: Organization
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  vercelIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
}

export const ProjectCard = ({
  slug,
  project,
  organization,
  rewriteHref,
  githubIntegration,
  vercelIntegration,
  resourceWarnings,
}: ProjectCardProps) => {
  const { name, ref: projectRef } = project
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { infraAwsNimbusLabel } = useCustomContent(['infra:aws_nimbus_label'])
  const providerLabel =
    project.cloud_provider === 'AWS_NIMBUS' ? infraAwsNimbusLabel : project.cloud_provider

  const desc = `${providerLabel} | ${project.region}`

  const { projectHomepageShowInstanceSize } = useIsFeatureEnabled([
    'project_homepage:show_instance_size',
  ])

  const isGithubIntegrated = githubIntegration !== undefined
  const isVercelIntegrated = vercelIntegration !== undefined
  const githubRepository = githubIntegration?.metadata.name ?? undefined
  const projectStatus = inferProjectStatus(project.status)

  return (
    <>
      <li className="list-none h-min">
        <CardButton
          linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
          className="h-44 !px-0 group pt-5 pb-0 overflow-hidden relative"
          hideChevron
          title={
            <div className="w-full flex flex-col gap-y-4 justify-between px-5 z-10">
              <div className="flex flex-col gap-y-0.5 relative z-10">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm flex-shrink truncate pr-5">{name}</h5>
                  <div onClick={(e) => e.preventDefault()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="text"
                          icon={<MoreVertical size={14} />}
                          className="w-6 h-6 px-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="gap-x-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(projectRef)
                            toast.success('Copied project ID to clipboard')
                          }}
                        >
                          <Copy size={14} />
                          <span>Copy project ID</span>
                        </DropdownMenuItem>
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
                </div>
                <p className="text-sm text-foreground-lighter">{desc}</p>
              </div>
              <div className="flex items-center gap-x-1.5 relative z-10">
                <ProjectCardStatus
                  projectStatus={projectStatus}
                  resourceWarnings={resourceWarnings}
                  renderMode="badge"
                />
                {project.status !== 'INACTIVE' && projectHomepageShowInstanceSize && (
                  <ComputeBadgeWrapper
                    slug={slug}
                    projectRef={project.ref}
                    cloudProvider={project.cloud_provider}
                    computeSize={getComputeSize(project)}
                  />
                )}
                {isVercelIntegrated && (
                  <div className="bg-surface-100 w-5 h-5 p-1 border border-strong rounded-md flex items-center justify-center text-black dark:text-white">
                    <InlineSVG
                      src={`${BASE_PATH}/img/icons/vercel-icon.svg`}
                      title="Vercel Icon"
                      className="w-3"
                    />
                  </div>
                )}
                {isGithubIntegrated && (
                  <div className="bg-surface-100 flex items-center gap-x-0.5 h-5 pr-1 border border-strong rounded-md">
                    <div className="w-5 h-5 p-1 flex items-center justify-center">
                      <Github size={12} strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-foreground-light truncate">{githubRepository}</p>
                  </div>
                )}
              </div>
            </div>
          }
          footer={
            <ProjectCardStatus projectStatus={projectStatus} resourceWarnings={resourceWarnings} />
          }
          containerElement={<ProjectIndexPageLink projectRef={projectRef} />}
        />
      </li>
      <DeleteProjectModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        project={project}
        organization={organization}
      />
    </>
  )
}
