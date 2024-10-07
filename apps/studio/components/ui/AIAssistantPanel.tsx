import { useAppStateSnapshot } from 'state/app-state'
import { Separator, Sheet, SheetContent, SheetHeader } from 'ui'

export const AIAssistant = () => {
  const { showAiAssistantPanel, setShowAiAssistantPanel } = useAppStateSnapshot()
  return (
    <Sheet
      open={showAiAssistantPanel}
      onOpenChange={() => setShowAiAssistantPanel(!showAiAssistantPanel)}
    >
      <SheetContent showClose size="lg">
        <SheetHeader>Hello</SheetHeader>
        <Separator />
        <SheetContent>World</SheetContent>
      </SheetContent>
    </Sheet>
  )
}
