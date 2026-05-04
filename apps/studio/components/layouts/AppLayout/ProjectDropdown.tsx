import { useParams } from 'common'
import { Box, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Button, CommandGroup_Shadcn_, CommandItem_Shadcn_ } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

import { AppLayoutDropdownTriggerButton } from './AppLayoutDropdown'
import { sanitizeRoute } from './ProjectDropdown.utils'
import { ProjectRowLink } from './ProjectRowLink'
import { useEmbeddedCloseHandler } from './useEmbeddedCloseHandler'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { getManagedByFromOrganizationPartner } from '@/data/organizations/managed-by-utils'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import type { ManagedBy } from '@/lib/constants/infrastructure'

// --- Sub-components ---

interface ProjectDropdownNewProjectActionsProps {
  organizationSlug: string | undefined
  embedded: boolean
  onClose: () => void
  onNavigate: (href: string) => void
}

function ProjectDropdownNewProjectActions({
  organizationSlug,
  embedded,
  onClose,
  onNavigate,
}: ProjectDropdownNewProjectActionsProps) {
  const href = `/new/${organizationSlug}`

  if (embedded) {
    return (
      <Button type="default" block size="small" asChild icon={<Plus size={14} strokeWidth={1.5} />}>
        <Link
          href={href}
          onClick={onClose}
          className="text-xs text-foreground-light hover:text-foreground"
        >
          New project
        </Link>
      </Button>
    )
  }

  return (
    <CommandGroup_Shadcn_>
      <CommandItem_Shadcn_
        className="cursor-pointer w-full"
        onSelect={() => {
          onClose()
          onNavigate(href)
        }}
        onClick={onClose}
      >
        <Link href={href} onClick={onClose} className="w-full flex items-center gap-2">
          <Plus size={14} strokeWidth={1.5} />
          <p>New project</p>
        </Link>
      </CommandItem_Shadcn_>
    </CommandGroup_Shadcn_>
  )
}

function ProjectDropdownNonPlatformView({ projectName }: { projectName: string }) {
  return (
    <Button type="text">
      <span className="text-sm">{projectName}</span>
    </Button>
  )
}

interface ProjectDropdownPlatformViewProps {
  projectRef: string | undefined
  projectName: string
  projectManagedBy?: ManagedBy
  selectorProps: Omit<
    ComponentProps<typeof OrganizationProjectSelector>,
    'renderTrigger' | 'embedded'
  >
}

function ProjectDropdownPlatformView({
  projectRef,
  projectName,
  projectManagedBy,
  selectorProps,
}: ProjectDropdownPlatformViewProps) {
  return (
    <div className="flex items-center shrink-0">
      <Link href={`/project/${projectRef}`} className="flex items-center gap-2 shrink-0 text-sm">
        <Box size={14} strokeWidth={1.5} className="text-foreground-lighter" />
        <span title={projectName} className="text-foreground max-w-32 lg:max-w-64 truncate">
          {projectName}
        </span>
        {projectManagedBy && <PartnerIcon organization={{ managed_by: projectManagedBy }} />}
      </Link>

      <OrganizationProjectSelector
        {...selectorProps}
        renderTrigger={() => <AppLayoutDropdownTriggerButton className="shrink-0" />}
      />
    </div>
  )
}

// --- Main component ---

interface ProjectDropdownProps {
  embedded?: boolean
  className?: string
  onClose?: () => void
}

export const ProjectDropdown = ({
  embedded = false,
  className,
  onClose,
}: ProjectDropdownProps = {}) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const isBranch = project?.parentRef !== project?.ref
  const { data: parentProject, isPending: isLoadingParentProject } = useProjectDetailQuery(
    { ref: project?.parent_project_ref },
    { enabled: isBranch }
  )
  const selectedProject = parentProject ?? project

  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const [open, setOpen] = useState(false)
  const close = useEmbeddedCloseHandler(embedded, onClose, setOpen)
  const selectedProjectManagedBy = selectedProject?.integration_source
    ? getManagedByFromOrganizationPartner(undefined, selectedProject.integration_source)
    : selectedOrganization?.billing_partner
      ? selectedOrganization.managed_by
      : undefined

  if (isLoadingProject || (isBranch && isLoadingParentProject) || !selectedProject) {
    if (!embedded) return <ShimmeringLoader className="p-2 md:mr-2 md:w-[90px]" />
  }

  const handleSetOpen = embedded ? (_value: boolean) => onClose?.() : setOpen

  const selectorProps = {
    open,
    setOpen: handleSetOpen,
    selectedRef: ref,
    onSelect: (project: { ref: string }) => {
      const sanitizedRoute = sanitizeRoute(router.route, router.query)
      const href = sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`
      close()
      router.push(href)
    },
    renderRow: (project: Pick<OrgProject, 'ref' | 'name' | 'status' | 'integration_source'>) => (
      <ProjectRowLink
        project={project}
        selectedRef={ref}
        route={router.route}
        routerQueries={router.query}
      />
    ),
    renderActions: (_setOpen: (value: boolean) => void, options?: { embedded?: boolean }) =>
      projectCreationEnabled ? (
        <ProjectDropdownNewProjectActions
          organizationSlug={selectedOrganization?.slug}
          embedded={options?.embedded ?? false}
          onClose={close}
          onNavigate={(href) => router.push(href)}
        />
      ) : null,
  }

  if (embedded)
    return (
      <OrganizationProjectSelector {...selectorProps} embedded className={className} fetchOnMount />
    )

  return IS_PLATFORM ? (
    <ProjectDropdownPlatformView
      projectRef={project?.ref}
      projectName={selectedProject?.name ?? ''}
      projectManagedBy={selectedProjectManagedBy}
      selectorProps={selectorProps}
    />
  ) : (
    <ProjectDropdownNonPlatformView projectName={selectedProject?.name ?? ''} />
  )
}
