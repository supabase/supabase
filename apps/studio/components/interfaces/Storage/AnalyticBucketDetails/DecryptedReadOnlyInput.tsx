import { ExternalLink, Eye, EyeOff, Loader } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Input, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

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
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [showHidden, setShowHidden] = useState(false)

  const { data: decryptedValue, isLoading: isDecryptedValueLoading } =
    useVaultSecretDecryptedValueQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        id: value ?? '',
      },
      { enabled: secureEntry && showHidden }
    )

  const isLoading = isDecryptedValueLoading && showHidden
  const renderedValue = secureEntry
    ? isLoading
      ? 'Fetching value from Vault...'
      : showHidden
        ? decryptedValue
        : value
    : value

  return (
    <Input
      readOnly
      // If the value is secure, allow copying to clipboard if the value is revealed. Otherwise, always allow copying
      copy={!secureEntry || (!isDecryptedValueLoading && showHidden)}
      disabled
      label={
        <div className="flex items-center gap-x-2">
          <span>{label}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                target="_blank"
                rel="noreferrer noopener"
                href={`/project/${ref}/integrations/vault/secrets?search=${value}`}
              >
                <ExternalLink
                  size={14}
                  className="text-foreground-lighter hover:text-foreground-light transition"
                />
              </a>
            </TooltipTrigger>
            <TooltipContent side="bottom">View parameter in Vault</TooltipContent>
          </Tooltip>
        </div>
      }
      value={renderedValue}
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
