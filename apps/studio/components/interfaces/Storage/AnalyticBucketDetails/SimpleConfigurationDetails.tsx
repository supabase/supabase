import Link from '@ui/components/Typography/Link'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldSectionDescription, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { Card } from 'ui'
import { getCatalogURI, getConnectionURL } from '../StorageSettings/StorageSettings.utils'
import { DESCRIPTIONS } from './constants'
import { CopyEnvButton } from './CopyEnvButton'
import { DecryptedReadOnlyInput } from './DecryptedReadOnlyInput'

const wrapperMeta = {
  options: [
    { name: 'vault_token', label: 'Vault Token', secureEntry: false },
    { name: 'warehouse', label: 'Warehouse', secureEntry: false },
    { name: 's3.endpoint', label: 'S3 Endpoint', secureEntry: false },
    { name: 'catalog_uri', label: 'Catalog URI', secureEntry: false },
  ],
}

export const SimpleConfigurationDetails = ({ bucketName }: { bucketName: string }) => {
  const { project } = useProjectContext()

  const { data: apiKeys } = useAPIKeysQuery({ projectRef: project?.ref })
  const { data: settings } = useProjectSettingsV2Query({ projectRef: project?.ref })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint

  const { serviceKey } = getKeys(apiKeys)
  const serviceApiKey = serviceKey?.api_key ?? 'SUPABASE_CLIENT_SERVICE_KEY'

  const values: Record<string, string> = {
    vault_token: serviceApiKey,
    warehouse: bucketName,
    's3.endpoint': getConnectionURL(project?.ref ?? '', protocol, endpoint),
    catalog_uri: getCatalogURI(project?.ref ?? '', protocol, endpoint),
  }

  return (
    <div>
      <div className="flex flex-row justify-between items-center">
        <div>
          <ScaffoldSectionTitle>Configuration Details</ScaffoldSectionTitle>
          <ScaffoldSectionDescription className="mb-4">
            You can use the following configuration details to connect to the bucket from your code.
          </ScaffoldSectionDescription>
        </div>
        <CopyEnvButton serverOptions={wrapperMeta.options} values={values} />
      </div>
      <Card className="flex flex-col gap-6 p-6 pb-0">
        <p className="text-sm text-foreground-light mb-4">
          To get AWS credentials, you can create them using the{' '}
          <Link href={`/project/${project?.ref}/settings/storage`}>
            <a className="underline ">S3 Access Keys</a>
          </Link>{' '}
          feature.
        </p>
        {wrapperMeta.options.map((option) => {
          return (
            <DecryptedReadOnlyInput
              key={option.name}
              label={option.label}
              value={values[option.name]}
              secureEntry={option.secureEntry}
              descriptionText={DESCRIPTIONS[option.name]}
            />
          )
        })}
      </Card>
    </div>
  )
}
