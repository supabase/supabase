import { BoxIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui'

import { MemberOauthGrantItem } from '@/data/oauth-apps/types'

export const GrantProjectsDialogContent = ({ grant }: { grant: MemberOauthGrantItem }) => {
  return (
    <DialogContent onCloseAutoFocus={(event) => event.preventDefault()}>
      <DialogHeader className="px-0 md:px-0">
        <DialogTitle className="px-4 md:px-5">Projects using {grant?.app.name}</DialogTitle>
        <DialogDescription asChild>
          <div className="h-90 overflow-y-auto scrollbar-gutter-stable">
            <Accordion type="multiple">
              {grant?.projects?.map((project) => {
                const permissionCount = grant.approved_scopes.length

                return (
                  <AccordionItem value={project.ref} key={project.ref}>
                    <AccordionTrigger className="hover:no-underline px-4 md:px-5">
                      <BoxIcon size={16} className="shrink-0 text-foreground-lighter rotate-0!" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{project.name}</p>
                        <p className="text-xs text-foreground-lighter">
                          {permissionCount} {permissionCount === 1 ? 'permission' : 'permissions'}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 md:px-5">
                      <div className="flex flex-col gap-3 pl-6">
                        <div className="flex flex-col gap-1">
                          <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
                            Permissions
                          </p>
                          <p className="text-xs text-foreground">
                            {grant.approved_scopes.join(', ')}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="default">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
