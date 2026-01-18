import { Github } from 'lucide-react'
import InlineSVG from 'react-inlinesvg'

import CardButton from 'components/ui/CardButton'
import { ComputeBadgeWrapper } from 'components/ui/ComputeBadgeWrapper'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { ProjectIndexPageLink } from 'data/prefetchers/project.$ref'
import { getComputeSize, OrgProject } from 'data/projects/org-projects-infinite-query'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { BASE_PATH } from 'lib/constants'
import { inferProjectStatus } from './ProjectCard.utils'
import { ProjectCardStatus } from './ProjectCardStatus'

export interface ProjectCardProps {
  slug?: string
  project: OrgProject
  rewriteHref?: string
  githubIntegration?: IntegrationProjectConnection
  vercelIntegration?: IntegrationProjectConnection
  resourceWarnings?: ResourceWarning
}

export const ProjectCard = ({
  slug,
  project,
  rewriteHref,
  githubIntegration,
  vercelIntegration,
  resourceWarnings,
}: ProjectCardProps) => {
  const { name, ref: projectRef } = project

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
    <li className="list-none h-min">
      <CardButton
        linkHref={rewriteHref ? rewriteHref : `/project/${projectRef}`}
        className="h-44 !px-0 group pt-5 pb-0"
        title={
          <div className="w-full flex flex-col gap-y-4 justify-between px-5">
            {/* Text */}
            <div className="flex flex-col gap-y-0.5">
              <h5 className="text-sm flex-shrink truncate pr-5">{name}</h5>
              <p className="text-sm text-foreground-lighter">{desc}</p>
            </div>
            {/* Compute and integrations */}
            <div className="flex items-center gap-x-1.5">
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
                <div className="bg-surface-100 flex items-center gap-x-0.5 h-5 pr-1 border border-strong rounded-md overflow-hidden">
                  <div className="w-5 h-5 p-1 flex items-center justify-center flex-shrink-0">
                    <Github size={12} strokeWidth={1.5} />
                  </div>
                  <p className="text-xs text-foreground-light truncate flex-1 min-w-0">
                    {githubRepository}
                  </p>
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
  )
}
