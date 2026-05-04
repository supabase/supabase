import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface CustomEmailTemplateRestrictionAdmonitionProps {
  projectRef?: string
}

export const CustomEmailTemplateRestrictionAdmonition = ({
  projectRef,
}: CustomEmailTemplateRestrictionAdmonitionProps) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const organizationSlug = selectedOrganization?.slug ?? '_'

  return (
    <Admonition
      type="default"
      layout="responsive"
      title="Set up Custom SMTP to edit templates"
      description="Default templates are read-only while this project uses Supabase’s built-in email service. Set up Custom SMTP or sign up to Pro to edit templates."
      actions={
        <div className="flex w-full @lg:w-auto">
          <Button asChild type="default" className="flex-1 rounded-r-none px-3 @lg:flex-none">
            <Link href={`/project/${projectRef ?? '_'}/auth/smtp`}>Set up SMTP</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px"
                icon={<ChevronDown />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link
                  href={`/org/${organizationSlug}/billing?panel=subscriptionPlan&source=authEmailTemplates`}
                >
                  <div className="space-y-0.5">
                    <p className="block text-foreground">Upgrade to Pro</p>
                    <p className="block text-foreground-light">
                      Edit templates while using Supabase email.
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/project/${projectRef ?? '_'}/auth/hooks`}>
                  <div className="space-y-0.5">
                    <p className="block text-foreground">Configure send-email hook</p>
                    <p className="block text-foreground-light">
                      Send auth emails through your own workflow.
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  )
}
