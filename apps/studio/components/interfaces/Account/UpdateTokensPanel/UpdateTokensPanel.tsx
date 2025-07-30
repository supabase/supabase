import { Button, Sheet, SheetContent, SheetFooter, SheetHeader, SheetSection, cn } from 'ui'
import { AccessToken } from 'data/access-tokens/access-tokens-query'

interface UpdateTokensPanelProps {
  visible: boolean
  token: AccessToken | undefined
  onClose: () => void
}

export function UpdateTokensPanel({ visible, token, onClose }: UpdateTokensPanelProps) {
  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent>
        <SheetHeader
          className={cn('py-3 flex flex-row justify-between gap-x-4 items-center border-b')}
        >
          <p className="truncate" title={`Manage access for ${token?.name}`}>
            Manage access for {token?.name}
          </p>
        </SheetHeader>
        <SheetSection>
          <p>Here you can update your tokens.</p>
          <p>{token?.name}</p>
        </SheetSection>
        <SheetFooter>
          <Button type="primary">Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
