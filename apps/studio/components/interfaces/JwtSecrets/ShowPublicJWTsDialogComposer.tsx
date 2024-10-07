import { useState } from 'react'
import { useParams } from 'common'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { Button, Alert_Shadcn_, AlertTitle_Shadcn_, AlertDescription_Shadcn_ } from 'ui'
import { WarningIcon } from 'ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'ui'
import { DialogSection, DialogSectionSeparator } from 'ui/src/components/shadcn/ui/dialog'
import { Key } from 'lucide-react'

const ShowPublicJWTsDialogComposer: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false)
  const { ref: projectRef } = useParams()
  const { data: apiKeysData } = useAPIKeysQuery({ projectRef })

  const inUseKey = apiKeysData?.find((key) => key.type === 'publishable')

  const algorithm = inUseKey?.algorithm || 'RS256'
  const jwksUrl = inUseKey?.jwksUrl || `https://${projectRef}.supabase.co/rest/v1/jwks`

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
            {algorithm === 'HS256' ? (
              <Alert_Shadcn_ variant="warning">
                <WarningIcon />
                <AlertTitle_Shadcn_>Unsupported Algorithm</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  The current JWT secret uses HS256 (Symmetric) algorithm, which doesn't support
                  public JWTs. Please change to RS256 to use this feature.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            ) : (
              <>
                <h4 className="text-sm mb-2">JWKS URL</h4>
                <pre className="bg-surface-100 border p-3 rounded-md text-xs overflow-x-auto break-all">
                  {jwksUrl}
                </pre>
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
