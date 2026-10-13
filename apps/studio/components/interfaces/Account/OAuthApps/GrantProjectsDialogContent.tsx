import { BoxIcon } from 'lucide-react'
import { ComponentProps } from 'react'
import {
  Button,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

import {
  OAuthGrantAccordion,
  OAuthGrantAccordionItem,
} from '@/components/interfaces/Organization/OAuthApps/OAuthGrantAccordionItem'
import { MemberOauthGrantItem } from '@/data/oauth-apps/types'
import { pluralize } from '@/lib/helpers'

interface GrantProjectsDialogContentProps extends ComponentProps<typeof DialogContent> {
  grant: MemberOauthGrantItem
}

export const GrantProjectsDialogContent = ({
  grant,
  ...props
}: GrantProjectsDialogContentProps) => {
  return (
    <DialogContent size="medium" {...props}>
      <DialogHeader>
        <DialogTitle>Projects using {grant?.app.name}</DialogTitle>
        <DialogDescription className="sr-only">
          My authorized projects using {grant?.app.name}
        </DialogDescription>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="p-0">
        <div className="max-h-94 overflow-y-auto">
          <OAuthGrantAccordion>
            {grant?.projects?.map((project) => {
              const permissionCount = grant.approved_scopes.length

              return (
                <OAuthGrantAccordionItem
                  key={project.ref}
                  value={project.ref}
                  icon={<BoxIcon size={16} />}
                  title={project.name}
                  description={`${permissionCount} ${pluralize(permissionCount, 'permission')}`}
                  sections={[{ label: 'Permissions', values: grant.approved_scopes }]}
                />
              )
            })}
          </OAuthGrantAccordion>
        </div>
      </DialogSection>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="default">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
