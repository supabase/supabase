import { Button } from 'ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui/src/components/shadcn/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui/src/components/shadcn/ui/select'
import { SigningKey, JWTAlgorithm } from 'state/jwt-secrets'
import { algorithmDescriptions, algorithmLabels } from '../../constants'

interface RotateKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  standbyKey: SigningKey | null
  algorithm: JWTAlgorithm
  onAlgorithmChange: (value: JWTAlgorithm) => void
  onReviewRotation: () => void
}

export const RotateKeyDialog = ({
  open,
  onOpenChange,
  standbyKey,
  algorithm,
  onAlgorithmChange,
  onReviewRotation,
}: RotateKeyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rotate Key</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <DialogDescription>
            {standbyKey ? (
              <>
                The standby key ({algorithmLabels[standbyKey.algorithm]}) will be promoted to 'In
                use'. This will:
                <ul className="list-disc pl-4 mt-2 space-y-2">
                  <li>Change the current standby key to 'In use'</li>
                  <li>Move the current 'In use' key to 'Previously used'</li>
                  <li>Move any 'Previously used' key to 'Revoked'</li>
                </ul>
              </>
            ) : (
              <>
                Since there is no standby key, you need to choose an algorithm for the new key:
                <div className="mt-4 space-y-4">
                  <Select value={algorithm} onValueChange={onAlgorithmChange}>
                    <SelectTrigger id="rotateAlgorithm">
                      <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HS256">HS256 (Symmetric)</SelectItem>
                      <SelectItem value="ES256">ES256 (ECC)</SelectItem>
                      <SelectItem value="RS256">RS256 (RSA)</SelectItem>
                      <SelectItem value="EdDSA">EdDSA (Ed25519)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-foreground-light">
                    {algorithmDescriptions[algorithm]}
                  </p>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogSection>
        <DialogFooter>
          <Button onClick={onReviewRotation}>Review Rotation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
