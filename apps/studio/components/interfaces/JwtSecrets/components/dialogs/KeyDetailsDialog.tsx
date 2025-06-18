import { FileKey } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui/src/components/shadcn/ui/dialog'
import { SigningKey } from 'state/jwt-secrets'

interface KeyDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedKey: SigningKey | null
}

export const KeyDetailsDialog = ({ open, onOpenChange, selectedKey }: KeyDetailsDialogProps) => {
  if (!selectedKey) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Key Details</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-6">
          <div className="bg-surface-100/50 border rounded-md">
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <FileKey strokeWidth={1.5} size={15} className="text-foreground-light" />
              <h4 className="text-xs font-mono">Public Key (PEM format)</h4>
            </div>
            <pre className="bg-surface-100 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-40">
              {typeof selectedKey.public_jwk === 'string'
                ? selectedKey.public_jwk
                : JSON.stringify(selectedKey.public_jwk ?? '', null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="text-sm mb-2">JWKS URL</h4>
            <pre className="bg-surface-100 border p-3 rounded-md text-xs overflow-x-auto break-all">
              {`${window.location.origin}/jwt/v1/jwks.json`}
            </pre>
          </div>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
