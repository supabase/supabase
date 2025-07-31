import { Sheet, SheetContent, SheetHeader, SheetSection, ScrollArea, ScrollBar, cn } from 'ui'
import { AccessToken } from 'data/access-tokens/access-tokens-query'
import { DocsButton } from 'components/ui/DocsButton'

interface ViewTokenPermissionsPanelProps {
  visible: boolean
  token: AccessToken | undefined
  onClose: () => void
}

export function ViewTokenPermissionsPanel({
  visible,
  token,
  onClose,
}: ViewTokenPermissionsPanelProps) {
  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent
        showClose={false}
        size="default"
        // className={cn('bg-surface-200 p-0 flex flex-row gap-0 !min-w-[600px]')}
      >
        <div className={cn('flex flex-col grow w-full')}>
          <SheetHeader
            className={cn('py-3 flex flex-row justify-between gap-x-4 items-center border-b')}
          >
            <p className="truncate" title={`Manage access for ${token?.name}`}>
              View access for {token?.name}
            </p>
            <DocsButton href="https://supabase.com/docs/guides/platform/access-control" />
          </SheetHeader>
          <SheetSection className="h-full overflow-auto flex flex-col gap-y-4">
            <ScrollArea className="h-full">
              <div>Configured access tokens in read mode only - here.</div>
              <ScrollBar />
            </ScrollArea>
          </SheetSection>
          {/* <SheetFooter className="flex items-center !justify-end px-5 py-4 w-full border-t">
            <Button type="default" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => onClose()}>
              Save changes
            </Button>
          </SheetFooter> */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
