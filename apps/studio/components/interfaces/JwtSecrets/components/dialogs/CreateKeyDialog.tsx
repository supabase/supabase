import { Button } from 'ui'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui/src/components/shadcn/ui/dialog'
import { Input } from 'ui/src/components/shadcn/ui/input'
import { Label } from 'ui/src/components/shadcn/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui/src/components/shadcn/ui/select'
import { Textarea } from 'ui/src/components/shadcn/ui/textarea'
import { Loader2 } from 'lucide-react'
import { JWTAlgorithm } from 'state/jwt-secrets'
import { algorithmDescriptions } from '../../constants'

interface CreateKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  algorithm: JWTAlgorithm
  onAlgorithmChange: (value: JWTAlgorithm) => void
  description: string
  onDescriptionChange: (value: string) => void
  customSigningKey: string
  onCustomSigningKeyChange: (value: string) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
  error?: string
}

export const CreateKeyDialog = ({
  open,
  onOpenChange,
  algorithm,
  onAlgorithmChange,
  description,
  onDescriptionChange,
  customSigningKey,
  onCustomSigningKeyChange,
  onSubmit,
  isLoading,
  error,
}: CreateKeyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new Standby Key</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4">
          <div>
            <Label htmlFor="algorithm">Choose the key type to use:</Label>
            <Select value={algorithm} onValueChange={onAlgorithmChange}>
              <SelectTrigger id="algorithm">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HS256">HS256 (Symmetric)</SelectItem>
                <SelectItem value="RS256">RS256 (RSA)</SelectItem>
                <SelectItem value="ES256">ES256 (ECC)</SelectItem>
                <SelectItem value="EdDSA">EdDSA (Ed25519)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">{algorithmDescriptions[algorithm]}</p>
          </div>
          <div>
            <Label htmlFor="description">Description:</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter key description"
            />
          </div>
          <div>
            <Label htmlFor="customSigningKey">Custom Signing Key (Optional):</Label>
            <Textarea
              id="customSigningKey"
              value={customSigningKey}
              onChange={(e) => onCustomSigningKeyChange(e.target.value)}
              placeholder="Enter custom signing key (optional)"
              rows={4}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </DialogSection>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Standby Key'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
