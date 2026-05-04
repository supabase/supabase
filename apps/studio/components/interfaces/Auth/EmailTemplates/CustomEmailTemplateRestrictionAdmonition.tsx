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
      description="You can use these default templates as-is. Set up Custom SMTP to edit their subject and body."
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
                  <div>
                    <p className="block text-foreground">Upgrade to Pro</p>
                    <p className="block text-foreground-lighter">
                      Edit templates while using Supabase’s email service
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/project/${projectRef ?? '_'}/auth/hooks`}>
                  <div>
                    <p className="block text-foreground">Configure send-email hook</p>
                    <p className="block text-foreground-lighter">
                      Send auth emails through your own workflow
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
