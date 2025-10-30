import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useJWTSigningKeyCreateMutation } from 'data/jwt-signing-keys/jwt-signing-key-create-mutation'
import { JWTAlgorithm } from 'data/jwt-signing-keys/jwt-signing-keys-query'
import { stringToBase64URL } from 'lib/base64url'
import {
  Badge,
  Button,
  Checkbox_Shadcn_,
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
  Textarea,
} from 'ui'

const RSA_JWK_REQUIRED_PROPERTIES = ['kty', 'n', 'e', 'p', 'q', 'd', 'dq', 'dp', 'qi']
const EC_JWK_REQUIRED_PROPERTIES = ['kty', 'crv', 'x', 'y', 'd']

export const CreateKeyDialog = ({
  projectRef,
  onClose,
}: {
  projectRef: string
  onClose: () => void
}) => {
  const [newKeyAlgorithm, setNewKeyAlgorithm] = useState<JWTAlgorithm>('ES256')
  const [isBYOK, setBYOK] = useState(false)
  const [privateKey, setPrivateKey] = useState('')
  const [isBase64, setBase64] = useState(false)

  const privateKeyMessage = useMemo(() => {
    const plain = privateKey.replace(/\s+/g, '')

    if (!plain) {
      return null
    }

    if (newKeyAlgorithm === 'HS256') {
      if (privateKey.length < 16) {
        return 'Secret must be at least 16 letters long'
      }

      return null
    }

    let jwk
    try {
      jwk = JSON.parse(privateKey)
    } catch (e: any) {
      return 'Private key is not valid JSON'
    }

    if (typeof jwk !== 'object' || !jwk) {
      return 'Private key must be a JSON object'
    }

    if (typeof jwk.kty !== 'string' || !jwk.kty) {
      return 'Private key must have a kty property'
    }

    if (newKeyAlgorithm === 'RS256') {
      if (jwk.kty !== 'RSA') {
        return 'Private key must be of RSA type'
      }

      if (jwk.e !== 'AQAB') {
        return 'RSA private keys must use the 65537 (AQAB) public exponent'
      }

      for (let prop of RSA_JWK_REQUIRED_PROPERTIES) {
        if (typeof jwk[prop] !== 'string' || !jwk[prop]) {
          return `Incomplete RSA private key, required properties are: ${RSA_JWK_REQUIRED_PROPERTIES.join(', ')}`
        }
      }
    } else if (newKeyAlgorithm === 'ES256') {
      if (jwk.kty !== 'EC') {
        return 'Private key must be of EC type'
      }

      if (jwk.crv !== 'P-256') {
        return 'EC private keys must use P-256 curve'
      }

      for (let prop of EC_JWK_REQUIRED_PROPERTIES) {
        if (typeof jwk[prop] !== 'string' || !jwk[prop]) {
          return `Incomplete EC private key, required properties are: ${EC_JWK_REQUIRED_PROPERTIES.join(', ')}`
        }
      }
    }

    return null
  }, [privateKey, newKeyAlgorithm])

  const { mutate, isLoading: isLoadingMutation } = useJWTSigningKeyCreateMutation({
    onSuccess: () => {
      toast.success('Standby key created successfully')
      onClose()
    },
    onError: (error) => {
      let errorMessage = error.message

      if (errorMessage.includes('Please wait until')) {
        const dateString = errorMessage
          .replace('Please wait until ', '')
          .replace('before attempting this request again.', '')
          .trim()
        const date = dayjs(dateString)

        if (date.isValid()) {
          errorMessage = `Please wait for ${date.fromNow(true)} before attempting this request again.`
        }
      }
      toast.error(`Failed to add new standby key: ${errorMessage}`)
    },
  })

  const handleAddNewStandbyKey = async () => {
    mutate({
      projectRef: projectRef!,
      algorithm: newKeyAlgorithm,
      status: 'standby',
      private_jwk: isBYOK
        ? newKeyAlgorithm === 'HS256'
          ? {
              kty: 'oct',
              k: isBase64
                ? privateKey
                    .replace(/\s+/g, '')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=/g, '')
                : stringToBase64URL(privateKey),
            }
          : JSON.parse(privateKey)
        : null,
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create a new Standby Key</DialogTitle>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="space-y-4">
        <p className="text-sm text-foreground-light">
          Adds a new JSON Web Token signing key. Once all of your application's components have
          picked it up you can rotate the current key with it.
          <br />
          <br />
          This action does not invalidate existing tokens, so your users remain signed in.
        </p>
      </DialogSection>
      <DialogSectionSeparator />
      <DialogSection className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <Label_Shadcn_ htmlFor="algorithm">Choose signing algorithm:</Label_Shadcn_>
          <Select_Shadcn_
            name="algorithm"
            value={newKeyAlgorithm}
            onValueChange={(value: JWTAlgorithm) => setNewKeyAlgorithm(value)}
          >
            <SelectTrigger_Shadcn_ id="algorithm">
              <SelectValue_Shadcn_ placeholder="Select algorithm" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="ES256">
                <span>ES256 (ECC)</span>
                <Badge variant="brand" className="ml-2">
                  Recommended
                </Badge>
              </SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="RS256">RS256 (RSA)</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="HS256">HS256 (Shared Secret)</SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <div className="flex flex-col gap-4">
          <Label_Shadcn_ htmlFor="byok" className="flex items-center gap-x-2">
            <Checkbox_Shadcn_
              id="byok"
              checked={isBYOK}
              onCheckedChange={(value) => setBYOK(!!value)}
            />
            {newKeyAlgorithm === 'HS256'
              ? 'Import an existing secret'
              : 'Import an existing private key'}
          </Label_Shadcn_>
          {isBYOK && (
            <div className="flex flex-col gap-2">
              <Textarea
                className="font-mono"
                placeholder={
                  newKeyAlgorithm === 'HS256'
                    ? 'Type in your JWT secret'
                    : 'Add a private key in JWK (JSON Web Key) format'
                }
                value={privateKey}
                onChange={(e: any) => {
                  setPrivateKey(e.target.value)
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {privateKeyMessage && <p className="text-red-900 text-sm">{privateKeyMessage}</p>}
            </div>
          )}
          {isBYOK && newKeyAlgorithm === 'HS256' && (
            <>
              <Label_Shadcn_ htmlFor="base64" className="flex items-center gap-x-2">
                <Checkbox_Shadcn_
                  id="base64"
                  checked={isBase64}
                  onCheckedChange={(value) => setBase64(!!value)}
                />
                Secret is already Base64 encoded
              </Label_Shadcn_>
            </>
          )}
        </div>
      </DialogSection>
      <DialogFooter>
        <Button
          onClick={() => handleAddNewStandbyKey()}
          disabled={isLoadingMutation || !!privateKeyMessage}
          loading={isLoadingMutation}
        >
          Create standby key
        </Button>
      </DialogFooter>
    </>
  )
}
