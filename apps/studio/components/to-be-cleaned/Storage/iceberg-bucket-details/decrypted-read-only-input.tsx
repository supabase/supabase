import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useVaultSecretsQuery } from 'data/vault/vault-secrets-query'
import { Eye, EyeOff, Loader } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from 'ui'

export const DecryptedReadOnlyInput = ({
  secretName,
  value,
  secureEntry,
  descriptionText,
  label,
}: {
  secretName: string
  value?: string
  secureEntry: boolean
  descriptionText: string
  label: string
}) => {
  const [showHidden, setShowHidden] = useState(false)
  const { project } = useProjectContext()
  const {
    data: secrets,
    isLoading: isSecretsLoading,
    isSuccess: isSecretsSuccess,
  } = useVaultSecretsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const secret = secrets?.find((secret) => secret.name === secretName)
  const {
    isInitialLoading: isDecryptedValueInitialLoading,
    isLoading: isDecryptedValueLoading,
    data: decryptedValue,
  } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: secret?.id ?? '',
    },
    { enabled: !!(isSecretsSuccess && secret?.id && secureEntry && showHidden) }
  )

  const isLoading = isDecryptedValueLoading && showHidden

  return (
    <Input
      className="h-20"
      label={label}
      readOnly
      copy
      disabled
      value={
        secureEntry
          ? isLoading
            ? 'Fetching value from Vault...'
            : showHidden
              ? decryptedValue
              : value
          : value
      }
      type={secureEntry ? (isLoading ? 'text' : showHidden ? 'text' : 'password') : 'text'}
      descriptionText={descriptionText}
      layout="horizontal"
      actions={
        secureEntry ? (
          isLoading ? (
            <div className="flex items-center justify-center mr-1">
              <Button disabled type="default" icon={<Loader className="animate-spin" />} />
            </div>
          ) : (
            <div className="flex items-center justify-center mr-1">
              <Button
                type="default"
                icon={showHidden ? <Eye /> : <EyeOff />}
                onClick={() => setShowHidden(!showHidden)}
              />
            </div>
          )
        ) : null
      }
    />
  )
}
