import { ExternalLink, Eye, EyeOff, Loader } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
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
  const { project } = useProjectContext()
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
      copy
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
