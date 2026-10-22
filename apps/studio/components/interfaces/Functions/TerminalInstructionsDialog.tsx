import { parseAsString } from 'nuqs'
import { Dialog, DialogContent, DialogSection, DialogTitle } from 'ui'
import { usePanelQueryState } from '@/hooks/ui/usePanelQueryState'

import { TerminalInstructions } from './TerminalInstructions'

export const TerminalInstructionsDialog = () => {
  const [createMethod, setCreateMethod] = usePanelQueryState(
    'create',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const isOpen = createMethod === 'cli'

  const handleClose = () => {
    setCreateMethod(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="large">
        <DialogTitle className="sr-only">Create your first Edge Function via the CLI</DialogTitle>
        <DialogSection padding="small">
          <TerminalInstructions closable={false} />
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
