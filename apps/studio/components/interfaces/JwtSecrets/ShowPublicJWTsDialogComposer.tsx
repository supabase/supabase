import { useState } from 'react'
import { useAtom } from 'jotai'
import { Button, Alert_Shadcn_, AlertTitle_Shadcn_, AlertDescription_Shadcn_ } from 'ui'
import { WarningIcon } from 'ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'ui'
import { DialogSection, DialogSectionSeparator } from 'ui/src/components/shadcn/ui/dialog'
import { Key, RotateCw } from 'lucide-react'
import { secretKeysAtom, SecretKey } from './JWTSecretKeysTablev2'

const ShowPublicJWTsDialogComposer: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false)
  const [secretKeys, setSecretKeys] = useAtom(secretKeysAtom)
  const [isRolling, setIsRolling] = useState(false)

  const inUseKey = secretKeys.find((key: SecretKey) => key.status === 'IN_USE')

  const algorithm = inUseKey?.algorithm || 'RS256'
  const jwksUrl = inUseKey?.jwksUrl || ''

  const rollToRS256 = async () => {
    setIsRolling(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setSecretKeys((prevKeys: SecretKey[]) => {
      const updatedKeys = prevKeys.map((key: SecretKey) => {
        if (key.status === 'IN_USE') {
          return {
            ...key,
            status: 'PREVIOUSLY_USED' as const,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        }
        return key
      })

      const newKey = {
        id: Date.now().toString(),
        status: 'IN_USE' as const,
        keyId: Math.random().toString(36).substr(2, 8),
        createdAt: new Date().toISOString(),
        expiresAt: null,
        algorithm: 'RS256' as const,
        publicKey: `-----BEGIN PUBLIC KEY-----\nNEW_RS256_KEY_CONTENT\n-----END PUBLIC KEY-----`,
        jwksUrl: `https://example.com/new-rs256-jwks.json`,
      }

      return [...updatedKeys, newKey]
    })

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
                <WarningIcon />
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
                  <WarningIcon />
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
