import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { Eye, EyeOff, Loader } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from 'ui'

export const DecryptedReadOnlyInput = ({
  value,
  secureEntry,
  descriptionText,
  label,
}: {
  value?: string
  secureEntry: boolean
  descriptionText: string
  label: string
}) => {
  const [showHidden, setShowHidden] = useState(false)
  const { project } = useProjectContext()

  const { isLoading: isDecryptedValueLoading, data: decryptedValue } =
    useVaultSecretDecryptedValueQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        id: value ?? '',
      },
      { enabled: secureEntry && showHidden }
    )

  const isLoading = isDecryptedValueLoading && showHidden

  return (
    <Input
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
