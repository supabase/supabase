import { BoxesIcon } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Card } from 'ui'

import { InlineLink } from './InlineLink'
import { type MemberWithFreeProjectLimit } from '@/data/organizations/free-project-limit-check-query'

export const ExceedFreeProjectLimitMembers = ({
  membersExceededLimit,
}: {
  membersExceededLimit: MemberWithFreeProjectLimit[]
}) => {
  return (
    <>
      <p>Members exceeding limit:</p>
      <Card>
        <Accordion type="multiple">
          {membersExceededLimit?.map((member) => (
            <AccordionItem
              className="px-4 last:border-b-0"
              key={member.primary_email}
              value={member.primary_email}
            >
              <AccordionTrigger>
                <p className="mb-0! flex items-center gap-x-2">
                  <span>{member.primary_email}</span>
                  <span className="text-foreground-light">
                    (Limit: {member.free_project_limit} free projects)
                  </span>
                </p>
              </AccordionTrigger>
              <AccordionContent className="[&>div]:flex [&>div]:flex-col [&>div]:gap-y-2">
                {member.free_plan_organizations.map((org) => (
                  <div key={org.slug || org.organization_name}>
                    <InlineLink
                      href={`/org/${org.slug ?? '_'}/billing`}
                      className="flex items-center gap-x-2"
                    >
                      <BoxesIcon size={14} />
                      <p>{org.organization_name}</p>
                    </InlineLink>
                    <ul className="list-disc! pl-6!">
                      {org.projects.map((project) => (
                        <li key={project.ref || project.name}>
                          <InlineLink
                            className="text-foreground-light"
                            href={`/project/${project.ref || '_'}`}
                          >
                            {project.name}
                          </InlineLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </>
  )
}
