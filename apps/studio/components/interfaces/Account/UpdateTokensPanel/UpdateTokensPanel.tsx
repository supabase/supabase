import {
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  ScrollArea,
  ScrollBar,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  Button,
  cn,
  Select,
} from 'ui'
import { AccessToken } from 'data/access-tokens/access-tokens-query'
import { DocsButton } from 'components/ui/DocsButton'
import { DUMMY_PERMISSIONS } from './UpdateTokensPanel.constants' // This is just for prototyping, will be replaced with endpoints when available.

interface UpdateTokensPanelProps {
  visible: boolean
  token: AccessToken | undefined
  onClose: () => void
}

export function UpdateTokensPanel({ visible, token, onClose }: UpdateTokensPanelProps) {
  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent
        showClose={false}
        size="default"
        className={cn('bg-surface-200 p-0 flex flex-row gap-0 !min-w-[600px]')}
      >
        <div className={cn('flex flex-col grow w-full')}>
          <SheetHeader
            className={cn('py-3 flex flex-row justify-between gap-x-4 items-center border-b')}
          >
            <p className="truncate" title={`Manage access for ${token?.name}`}>
              Manage access for {token?.name}
            </p>
            <DocsButton href="https://supabase.com/docs/guides/platform/access-control" />
          </SheetHeader>
          <SheetSection className="h-full overflow-auto flex flex-col gap-y-4">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-4">
                {DUMMY_PERMISSIONS.map((section, i) => (
                  <>
                    <div className="space-y-1" key={i}>
                      <h5>{section.title}</h5>
                      <div className="prose text-sm max-w-2xl">{section.description}</div>
                    </div>
                    {section.permissions.map((permission, j) => (
                      <div className="flex items-center justify-between space-y-1" key={j}>
                        <p className="text-sm">{permission.title}</p>
                        <Select_Shadcn_
                          defaultValue={'No access'}
                          onValueChange={(value) => {
                            // Handle value change logic here
                            console.log(`Changed ${permission.title} to ${value}`)
                          }}
                        >
                          <SelectTrigger_Shadcn_ className="text-sm h-8 w-32 mr-1">
                            <span className="text-sm">No access</span>
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectGroup_Shadcn_>
                              {permission.options.map((option) => (
                                <SelectItem_Shadcn_ key={option} value={option}>
                                  {option}
                                </SelectItem_Shadcn_>
                              ))}
                            </SelectGroup_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </div>
                    ))}
                    <Separator />
                  </>
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </SheetSection>
          <SheetFooter className="flex items-center !justify-end px-5 py-4 w-full border-t">
            <Button type="default" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => onClose()}>
              Save changes
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
