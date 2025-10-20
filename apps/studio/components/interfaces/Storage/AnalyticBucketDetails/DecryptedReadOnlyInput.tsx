import { ExternalLink, Eye, EyeOff, Loader } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, CardContent, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

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
    <CardContent className="py-6 border-b border-panel-border-interior-light">
      <FormItemLayout
        layout="horizontal"
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
                    className="text-foreground-muted hover:text-foreground-lighter transition"
                  />
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open in Vault</TooltipContent>
            </Tooltip>
          </div>
        }
        description={descriptionText}
        isReactForm={false}
      >
        <Input
          readOnly
          // If the value is secure, allow copying to clipboard if the value is revealed. Otherwise, always allow copying
          copy={!secureEntry || (!isDecryptedValueLoading && showHidden)}
          value={renderedValue}
          type={secureEntry ? (isLoading ? 'text' : showHidden ? 'text' : 'password') : 'text'}
          actions={
            secureEntry ? (
              isLoading ? (
                <div className="flex items-center justify-center">
                  <Button
                    disabled
                    type="default"
                    className="w-7"
                    icon={<Loader className="animate-spin" />}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Button
                    type="default"
                    className="w-7"
                    loading={showHidden && isDecryptedValueLoading}
                    icon={showHidden ? <Eye /> : <EyeOff />}
                    onClick={() => setShowHidden(!showHidden)}
                  />
                </div>
              )
            ) : null
          }
        />
      </FormItemLayout>
    </CardContent>
  )
}
