import { Copy } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { getDecryptedValue } from 'data/vault/vault-secret-decrypted-value-query'
import { copyToClipboard } from 'ui'

export const CopyEnvButton = ({
  serverOptions,
  values,
}: {
  serverOptions: { name: string; secureEntry: boolean }[]
  values: Record<string, string>
}) => {
  const { project } = useProjectContext()
  const [isLoading, setIsLoading] = useState(false)

  const onCopy = useCallback(async () => {
    setIsLoading(true)
    const envFile = Promise.all(
      serverOptions.map(async (option) => {
        if (option.secureEntry) {
          const decryptedValue = await getDecryptedValue({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            id: values[option.name],
          })
          return `${option.name.toUpperCase().replace('VAULT_', '')}=${decryptedValue[0].decrypted_secret}`
        }
        return `${option.name.toUpperCase().replace('.', '_')}=${values[option.name]}`
      })
    ).then((values) => values.join('\n'))

    copyToClipboard(envFile, () => {
      toast.success('Copied to clipboard')
      setIsLoading(false)
    })
  }, [serverOptions, values])

  return (
    <ButtonTooltip
      type="primary"
      loading={isLoading}
      icon={<Copy />}
      onClick={onCopy}
      tooltip={{
        content: {
          text: (
            <span>
              Copies an <span className="text-brand">.env file</span> with the configuration details
              to your clipboard.
            </span>
          ),
        },
      }}
    >
      Copy env values
    </ButtonTooltip>
  )
}
