import clsx from 'clsx'
import Link from 'next/link'
import {
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  IconChevronRight,
} from 'ui'

import { useSelectedOrganization } from 'hooks'
import { Project } from 'types'

interface ProjectSettingsMenuItemProps {
  project: Project
}

const ProjectSettingsMenuItem = ({ project }: ProjectSettingsMenuItemProps) => {
  const organization = useSelectedOrganization()
  const isOrgBilling = !!organization?.subscription_id

  // [Joshen] Links need to be updated once we start implementing these
  const projectSettings = isOrgBilling
    ? [
        { label: 'General', pathname: `/org/[slug]/settings` },
        { label: 'Infrastructure', pathname: `/org/[slug]/settings` },
        { label: 'Add Ons', pathname: `/org/[slug]/settings` },
      ]
    : [
        { label: 'General', pathname: `/org/[slug]/settings` },
        { label: 'Subscription', pathname: `/org/[slug]/settings` },
        { label: 'Usage', pathname: `/org/[slug]/settings` },
        { label: 'Invoices', pathname: `/org/[slug]/settings` },
      ]

  return (
    <AccordionItem_Shadcn_ value={project.ref} className="!border-none">
      <AccordionTrigger_Shadcn_
        hideIcon
        className="py-1.5 hover:!no-underline [&[data-state=open]>div>svg]:!rotate-90 [&[data-state=open]>div>p]:text-scale-1200"
      >
        <div className="flex items-center space-x-2">
          <IconChevronRight
            className="h-4 w-4 transition-transform duration-200"
            strokeWidth={1.5}
          />
          <p className="text-scale-1100 text-sm font-normal transition duration-200">
            {project.name}
          </p>
        </div>
      </AccordionTrigger_Shadcn_>
      <AccordionContent_Shadcn_>
        <div className="space-y-2 pl-6 mt-1">
          {projectSettings.map((link) => (
            <div key={link.label}>
              <Link href={link.pathname.replace('[slug]', '')}>
                <a
                  className={clsx(
                    'text-sm',
                    false ? 'text-scale-1200' : 'text-scale-1100 hover:text-scale-1200 transition'
                  )}
                >
                  {link.label}
                </a>
              </Link>
            </div>
          ))}
        </div>
      </AccordionContent_Shadcn_>
    </AccordionItem_Shadcn_>
  )
}

export default ProjectSettingsMenuItem
