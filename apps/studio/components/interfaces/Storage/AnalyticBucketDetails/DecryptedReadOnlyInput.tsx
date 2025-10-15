import { useParams } from 'common'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ExternalLink, Eye, EyeOff, Loader } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
    <CardContent className="flex flex-row gap-2 py-6 border-b border-panel-border-interior-light">
      <div className="flex-1">
        <FormItemLayout
          layout="horizontal"
          label={label}
          isReactForm={false}
          description={descriptionText}
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
        </FormItemLayout>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            type="outline"
            size="tiny"
            className="mt-1 px-1.5"
            icon={<ExternalLink strokeWidth={2} className="text-foreground-lighter" />}
            aria-label="Open in Vault"
          >
            <Link href={`/project/${ref}/integrations/vault/secrets?search=${value}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Open in Vault</TooltipContent>
      </Tooltip>
    </CardContent>
  )
}
