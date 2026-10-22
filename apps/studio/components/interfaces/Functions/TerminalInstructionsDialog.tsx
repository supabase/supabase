import { parseAsString } from 'nuqs'
import { Dialog, DialogContent, DialogSection, DialogTitle } from 'ui'

import { TerminalInstructions } from './TerminalInstructions'
import { usePanelQueryState } from '@/hooks/ui/usePanelQueryState'

export const TerminalInstructionsDialog = () => {
  const [createMethod, setCreateMethod] = usePanelQueryState(
    'create',
    parseAsString.withOptions({ history: 'push' })
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
