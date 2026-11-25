import { BoxIcon } from 'lucide-react'
import { ComponentProps } from 'react'
import {
  Button,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  ScrollArea,
} from 'ui'

import {
  OAuthGrantAccordion,
  OAuthGrantAccordionItem,
} from '@/components/interfaces/Organization/OAuthApps/OAuthGrantAccordionItem'
import { OAuthGrant } from '@/data/oauth-apps/oauth-apps-grants-query'
import { pluralize } from '@/lib/helpers'

interface GrantProjectsDialogContentProps extends ComponentProps<typeof DialogContent> {
  grant: OAuthGrant
}

export const GrantProjectsDialogContent = ({
  grant,
  ...props
}: GrantProjectsDialogContentProps) => {
  return (
    <DialogContent size="medium" {...props}>
      <DialogHeader>
        <DialogTitle>Projects using {grant?.attributes.app.name}</DialogTitle>
        <DialogDescription className="sr-only">
          My authorized projects using {grant?.attributes.app.name}
        </DialogDescription>
      </DialogHeader>
      <DialogSectionSeparator />
      <ScrollArea className="px-4 h-94">
        <OAuthGrantAccordion>
          {grant?.attributes.projects?.map((project) => {
            const permissionCount = grant.attributes.approved_scopes.length

            return (
              <OAuthGrantAccordionItem
                key={project.ref}
                value={project.ref}
                icon={<BoxIcon size={16} />}
                title={project.name}
                description={`${permissionCount} ${pluralize(permissionCount, 'permission')}`}
                sections={[{ label: 'Permissions', values: grant.attributes.approved_scopes }]}
              />
            )
          })}
        </OAuthGrantAccordion>
      </ScrollArea>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="default">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
