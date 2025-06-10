import { Key, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { useJwtSecrets } from 'state/jwt-secrets'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import type { SigningKey } from 'state/jwt-secrets'

interface ShowPublicJWTsDialogComposerProps {
  inUseKey?: SigningKey | null
}

const ShowPublicJWTsDialogComposer = ({ inUseKey }: ShowPublicJWTsDialogComposerProps) => {
  const [showDialog, setShowDialog] = useState(false)
  const { rotateKey } = useJwtSecrets()
  const [isRolling, setIsRolling] = useState(false)

  const algorithm = inUseKey?.algorithm || 'RS256'
  const publicJwk =
    typeof inUseKey?.public_jwk === 'string'
      ? inUseKey.public_jwk
      : JSON.stringify(inUseKey?.public_jwk ?? '')

  const rollToRS256 = async () => {
    setIsRolling(true)
    await rotateKey('RS256')
    setIsRolling(false)
  }

  return (
    <>
      <div
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 text-xs text-foreground-light hover:text-foreground cursor-pointer"
      >
        <Key size={14} className="text-foreground-light" />
        Show Public JWTs
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Public JWTs</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection>
            <h4 className="text-sm mb-2">Public Key</h4>
            {publicJwk ? (
              <pre className="bg-surface-100 border p-3 rounded-md text-xs overflow-x-auto break-all">
                {publicJwk}
              </pre>
            ) : (
              <Alert_Shadcn_ variant="warning">
                <AlertTitle_Shadcn_>No Public Key Available</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  There is currently no public key available for this project. This might be because
                  no JWT key has been configured yet, or there's an issue with the current key
                  setup.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}
          </DialogSection>
          {algorithm !== 'RS256' && (
            <DialogFooter>
              <Button
                type="default"
                loading={isRolling}
                onClick={rollToRS256}
                disabled={isRolling}
                icon={<RotateCw size={16} strokeWidth={1.5} />}
              >
                Switch to RS256
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ShowPublicJWTsDialogComposer
