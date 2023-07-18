import { useRouter } from 'next/router'
import { Accordion_Shadcn_, Button } from 'ui'

import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
import OrganizationSettingsMenuItem from './OrganizationSettingsMenuItem'
import ProjectSettingsMenuItem from './ProjectSettingsMenuItem'
import Link from 'next/link'

const OrganizationSettingsMenu = () => {
  const router = useRouter()
  const organization = useSelectedOrganization()
  const organizationSettings = [
    { label: 'Overview', pathname: `/org/[slug]/settings` },
    { label: 'Members', pathname: `/org/[slug]/team` },
    { label: 'Integrations', pathname: `/org/[slug]/integrations` },
    { label: 'Billing', pathname: `/org/[slug]/billing` },
    { label: 'Usage', pathname: `/org/[slug]/usage` },
    { label: 'Invoices', pathname: `/org/[slug]/invoices` },
    { label: 'OAuth Apps', pathname: `/org/[slug]/apps` },
    { label: 'Audit Logs', pathname: `/org/[slug]/audit` },
  ]

  const { data: allProjects } = useProjectsQuery()
  const projects = allProjects?.filter((project) => project.organization_id === organization?.id)

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm font-medium">Organization</p>
        {organizationSettings.map((link) => (
          <OrganizationSettingsMenuItem
            key={link.label}
            slug={organization?.slug ?? ''}
            link={link}
            isActive={link.pathname === router.pathname}
          />
        ))}
      </div>

      {/* [Joshen] We'll implement this in the second iteration, just to keep things small */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Projects</p>
        <Accordion_Shadcn_ type="single" collapsible className="w-full">
          {projects?.map((project) => (
            <ProjectSettingsMenuItem key={project.ref} project={project} />
          ))}
        </Accordion_Shadcn_>
      </div>
      <div>
        <Link href={`/new/${organization?.slug}`}>
          <a>
            <Button type="default" size="small">
              Create new project
            </Button>
          </a>
        </Link>
      </div>
    </div>
  )
}

export default OrganizationSettingsMenu
