import { ParsedUrlQuery } from 'querystring'
import { useParams } from 'common'
import { OrganizationProjectSelector } from 'components/ui/OrganizationProjectSelector'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { Box, Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Badge, Button, cn, CommandGroup_Shadcn_, CommandItem_Shadcn_ } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const sanitizeRoute = (route: string, routerQueries: ParsedUrlQuery) => {
  const queryArray = Object.entries(routerQueries)

  if (queryArray.length > 1) {
    // [Joshen] Ideally we shouldn't use hard coded numbers, but temp workaround
    // for storage bucket route since its longer
    const isStorageBucketRoute = 'bucketId' in routerQueries
    const isSecurityAdvisorRoute = 'preset' in routerQueries

    return route
      .split('/')
      .slice(0, isStorageBucketRoute || isSecurityAdvisorRoute ? 5 : 4)
      .join('/')
  } else {
    return route
  }
}

export const ProjectDropdown = () => {
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

  if (isLoadingProject || (isBranch && isLoadingParentProject) || !selectedProject) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return IS_PLATFORM ? (
    <>
      <Link
        href={`/project/${project?.ref}`}
        className="flex items-center gap-2 flex-shrink-0 text-sm"
      >
        <Box size={14} strokeWidth={1.5} className="text-foreground-lighter" />
        <span
          title={selectedProject.name}
          className="text-foreground max-w-32 lg:max-w-64 truncate"
        >
          {selectedProject.name}
        </span>
      </Link>

      <OrganizationProjectSelector
        open={open}
        setOpen={setOpen}
        selectedRef={ref}
        onSelect={(project) => {
          const sanitizedRoute = sanitizeRoute(router.route, router.query)
          const href = sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`
          router.push(href)
        }}
        renderTrigger={() => (
          <Button
            type="text"
            size="tiny"
            className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
            iconRight={<ChevronsUpDown strokeWidth={1.5} />}
          />
        )}
        renderRow={(project) => {
          // [Joshen] Temp while we're interim between v1 and v2 billing
          const sanitizedRoute = sanitizeRoute(router.route, router.query)
          const href = sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`
          const isSelected = project.ref === ref
          const isPaused = project.status === 'INACTIVE'

          return (
            <Link href={href} className="w-full flex items-center justify-between">
              <span className={cn('truncate', isSelected ? 'max-w-60' : 'max-w-64')}>
                {project.name}
                {isPaused && <Badge className="ml-2">Paused</Badge>}
              </span>
              {isSelected && <Check size={16} />}
            </Link>
          )
        }}
        renderActions={() => {
          return (
            projectCreationEnabled && (
              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  className="cursor-pointer w-full"
                  onSelect={() => {
                    setOpen(false)
                    router.push(`/new/${selectedOrganization?.slug}`)
                  }}
                  onClick={() => setOpen(false)}
                >
                  <Link
                    href={`/new/${selectedOrganization?.slug}`}
                    onClick={() => {
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2"
                  >
                    <Plus size={14} strokeWidth={1.5} />
                    <p>New project</p>
                  </Link>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            )
          )
        }}
      />
    </>
  ) : (
    <Button type="text">
      <span className="text-sm">{selectedProject?.name}</span>
    </Button>
  )
}
