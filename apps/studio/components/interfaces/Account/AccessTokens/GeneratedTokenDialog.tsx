import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input_Shadcn_,
} from 'ui'
import CopyButton from 'components/ui/CopyButton'

interface GeneratedTokenDialogProps {
  visible: boolean
  onClose: () => void
  generatedToken: any
}

const GeneratedTokenDialog = ({ visible, onClose, generatedToken }: GeneratedTokenDialogProps) => {
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Token Generated Successfully</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-foreground-light">
              Do copy this access token and store it in a secure place - you will not be able to see
              it again.
            </p>
            <div className="flex items-center gap-2">
              <Input_Shadcn_
                value={
                  generatedToken?.access_token ||
                  generatedToken?.token_alias ||
                  generatedToken?.token ||
                  ''
                }
                readOnly
                className="flex-1 input-mono"
                id="generatedToken"
              />
              <CopyButton
                text={
                  generatedToken?.access_token ||
                  generatedToken?.token_alias ||
                  generatedToken?.token ||
                  ''
                }
                onCopy={() => toast.success('Access token copied to clipboard')}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="default" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GeneratedTokenDialog
