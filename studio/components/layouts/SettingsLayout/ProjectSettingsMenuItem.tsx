import { useRouter } from 'next/router'
import {
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  IconChevronRight,
} from 'ui'

import { useSelectedOrganization } from 'hooks'
import { Project } from 'types'
import SettingsMenuItem from './SettingsMenuItem'

interface ProjectSettingsMenuItemProps {
  project: Project
}

const ProjectSettingsMenuItem = ({ project }: ProjectSettingsMenuItemProps) => {
  const router = useRouter()
  const organization = useSelectedOrganization()
  const isOrgBilling = !!organization?.subscription_id

  // [Joshen] Links need to be updated once we start implementing these
  const projectSettings = isOrgBilling
    ? [
        { label: 'General', pathname: `/project/[ref]/settings/general` },
        { label: 'Infrastructure', pathname: `/project/[ref]/settings/infrastructure` },
        { label: 'Add Ons', pathname: `/project/[ref]/settings/addons` },
      ]
    : [
        { label: 'General', pathname: `/project/[ref]/settings/general` },
        { label: 'Subscription', pathname: `/project/[ref]/settings/billing/subscription` },
        { label: 'Usage', pathname: `/project/[ref]/settings/billing/usage` },
        { label: 'Invoices', pathname: `/project/[ref]/settings/billing/invoices` },
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
          {projectSettings.map((link) => {
            const href = link.pathname.replace('[ref]', project.ref)
            return (
              <SettingsMenuItem
                key={link.label}
                label={link.label}
                href={href}
                isActive={href === router.asPath}
              />
            )
          })}
        </div>
      </AccordionContent_Shadcn_>
    </AccordionItem_Shadcn_>
  )
}

export default ProjectSettingsMenuItem
