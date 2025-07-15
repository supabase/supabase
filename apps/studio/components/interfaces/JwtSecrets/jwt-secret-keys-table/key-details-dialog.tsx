import { useMemo } from 'react'
import { FileKey } from 'lucide-react'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input,
  Textarea,
  Label_Shadcn_,
  Button,
} from 'ui'
import { JWTSigningKey } from 'data/jwt-signing-keys/jwt-signing-keys-query'

export function KeyDetailsDialog({
  selectedKey,
  restURL,
  onClose,
}: {
  selectedKey: JWTSigningKey
  restURL: string
  onClose: () => void
}) {
  const jwksURL = useMemo(() => new URL('/auth/v1/.well-known/jwks.json', restURL), [restURL])
  const jwk = useMemo(() => JSON.stringify(selectedKey.public_jwk, null, 2), [selectedKey])

  return (
    <>
      <DialogHeader>
        <DialogTitle>Key Details</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label_Shadcn_ htmlFor="key-id">Key ID</Label_Shadcn_>
          <Input id="key-id" value={selectedKey.id} readOnly />
        </div>
        <div className="flex flex-col gap-2">
          <Label_Shadcn_ htmlFor="discovery-url">Discovery URL</Label_Shadcn_>
          <Input id="discovery-url" value={jwksURL.href} readOnly />
        </div>
        <div className="flex flex-col gap-2">
          <Label_Shadcn_ htmlFor="jwk" className="flex flex-row gap-2 items-center">
            <FileKey className="size-4 text-foreground-light" />
            Public Key (JSON Web Key format)
          </Label_Shadcn_>
          <Textarea className="font-mono text-sm" rows={8} value={jwk} readOnly />
        </div>
      </DialogSection>
      <DialogFooter>
        <Button onClick={() => onClose()}>OK</Button>
      </DialogFooter>
    </>
  )
}
