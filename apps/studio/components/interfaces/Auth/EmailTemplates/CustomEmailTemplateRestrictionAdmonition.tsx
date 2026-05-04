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
      description="Default templates are read-only while this project uses Supabase's built-in email service. Set up Custom SMTP, or sign up to Pro, to edit them."
      actions={
        <div className="flex flex-col items-start gap-1">
          <Button asChild type="default">
            <Link href={`/project/${projectRef ?? '_'}/auth/smtp`}>Set up SMTP</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="text" size="tiny" iconRight={<ChevronDown size={14} />}>
                Other options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link
                  href={`/org/${organizationSlug}/billing?panel=subscriptionPlan&source=authEmailTemplates`}
                >
                  Upgrade to Pro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/project/${projectRef ?? '_'}/auth/hooks`}>
                  Configure send-email hook
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  )
}
