import { parseAsString, useQueryState } from 'nuqs'
import { Dialog, DialogContent, DialogDescription, DialogSection, DialogTitle } from 'ui'

import { TerminalInstructions } from './TerminalInstructions'

export const TerminalInstructionsDialog = () => {
  const [createMethod, setCreateMethod] = useQueryState('create', parseAsString)

  const isOpen = createMethod === 'cli'

  const handleClose = () => {
    setCreateMethod(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="large">
        <DialogTitle className="sr-only">Create your first Edge Function via the CLI</DialogTitle>
        <DialogDescription className="sr-only">
          Follow the CLI instructions to create your first Edge Function for this project.
        </DialogDescription>
        <DialogSection padding="small">
          <TerminalInstructions closable={false} />
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
