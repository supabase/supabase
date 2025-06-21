import { useJWTSigningKeyCreateMutation } from 'data/jwt-signing-keys/jwt-signing-key-create-mutation'
import { JWTAlgorithm } from 'data/jwt-signing-keys/jwt-signing-keys-query'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Label_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { algorithmDescriptions } from '../algorithm-details'

export const CreateKeyDialog = ({
  projectRef,
  onClose,
}: {
  projectRef: string
  onClose: () => void
}) => {
  const [newKeyAlgorithm, setNewKeyAlgorithm] = useState<JWTAlgorithm>('RS256')

  const { mutate, isLoading: isLoadingMutation } = useJWTSigningKeyCreateMutation({
    onSuccess: () => {
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to add new standby key: ${error.message}`)
    },
  })

  const handleAddNewStandbyKey = async () => {
    mutate({
      projectRef: projectRef!,
      algorithm: newKeyAlgorithm,
      status: 'standby',
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create a new Standby Key</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="space-y-4">
        <div>
          <Label_Shadcn_ htmlFor="algorithm">Choose the key type to use:</Label_Shadcn_>
          <Select_Shadcn_
            value={newKeyAlgorithm}
            onValueChange={(value: JWTAlgorithm) => setNewKeyAlgorithm(value)}
          >
            <SelectTrigger_Shadcn_ id="algorithm">
              <SelectValue_Shadcn_ placeholder="Select algorithm" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="HS256">HS256 (Symmetric)</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="RS256">RS256 (RSA)</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="ES256" disabled>
                ES256 (ECC)
              </SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="EdDSA" disabled>
                EdDSA (Ed25519)
              </SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
          <p className="text-sm text-muted-foreground mt-1">
            {algorithmDescriptions[newKeyAlgorithm]}
          </p>
        </div>
      </DialogSection>
      <DialogFooter>
        <Button
          onClick={() => handleAddNewStandbyKey()}
          disabled={isLoadingMutation}
          loading={isLoadingMutation}
        >
          Create standby key
        </Button>
      </DialogFooter>
    </>
  )
}
