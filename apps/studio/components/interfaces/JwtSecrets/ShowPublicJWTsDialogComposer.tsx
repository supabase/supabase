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

const ShowPublicJWTsDialogComposer: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false)
  const { secretKeys, rotateKey } = useJwtSecrets()
  const [isRolling, setIsRolling] = useState(false)

  const inUseKey = secretKeys.find((key) => key.status === 'IN_USE')
  const algorithm = inUseKey?.algorithm || 'RS256'
  const jwksUrl = inUseKey?.jwksUrl || ''

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
            <h4 className="text-sm mb-2">JWKS URL</h4>
            {jwksUrl ? (
              <pre className="bg-surface-100 border p-3 rounded-md text-xs overflow-x-auto break-all">
                {jwksUrl}
              </pre>
            ) : (
              <Alert_Shadcn_ variant="warning">
                <AlertTitle_Shadcn_>No JWKS URL Available</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  There is currently no JWKS URL set up for this project. This might be because no
                  JWT key has been configured yet, or there's an issue with the current key setup.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}

            {algorithm === 'HS256' && (
              <>
                <Alert_Shadcn_ variant="warning" className="mt-4">
                  <AlertTitle_Shadcn_>HS256 Algorithm in Use</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    The current JWT secret uses HS256 (Symmetric) algorithm. While the JWKS URL may
                    be available, HS256 doesn't support public key cryptography. Consider rolling to
                    RS256 for enhanced security and support for public JWTs.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <Button
                  onClick={rollToRS256}
                  disabled={isRolling}
                  className="mt-4"
                  icon={<RotateCw className={isRolling ? 'animate-spin' : ''} />}
                >
                  {isRolling ? 'Rolling to RS256...' : 'Roll to RS256'}
                </Button>
              </>
            )}
          </DialogSection>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ShowPublicJWTsDialogComposer
