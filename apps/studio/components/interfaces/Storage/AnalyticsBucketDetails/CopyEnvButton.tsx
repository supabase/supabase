import { Copy } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { Button } from 'ui'
import { getDecryptedValue } from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { copyToClipboard } from 'ui'

export const CopyEnvButton = ({
  serverOptions,
  values,
}: {
  serverOptions: { name: string; secureEntry: boolean }[]
  values: Record<string, string>
}) => {
  const { data: project } = useSelectedProjectQuery()
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
      toast.success('Copied to clipboard as environment variables')
      setIsLoading(false)
    })
  }, [serverOptions, values])

  return (
    <Button type="default" loading={isLoading} icon={<Copy />} onClick={onCopy}>
      Copy all
    </Button>
  )
}
