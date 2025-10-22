import {
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { InlineLink } from 'components/ui/InlineLink'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Card } from 'ui'
import { getCatalogURI, getConnectionURL } from '../StorageSettings/StorageSettings.utils'
import { DESCRIPTIONS } from './constants'
import { CopyEnvButton } from './CopyEnvButton'
import { DecryptedReadOnlyInput } from './DecryptedReadOnlyInput'

const wrapperMeta = {
  options: [
    { name: 'vault_token', label: 'Vault token', secureEntry: false },
    { name: 'warehouse', label: 'Warehouse name', secureEntry: false },
    { name: 's3.endpoint', label: 'S3 endpoint', secureEntry: false },
    { name: 'catalog_uri', label: 'Catalog URI', secureEntry: false },
  ],
}

export const SimpleConfigurationDetails = ({ bucketName }: { bucketName: string }) => {
  const { data: project } = useSelectedProjectQuery()

  const { data: apiKeys } = useAPIKeysQuery({ projectRef: project?.ref })
  const { data: settings } = useProjectSettingsV2Query({ projectRef: project?.ref })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.storage_endpoint || settings?.app_config?.endpoint

  const { serviceKey } = getKeys(apiKeys)
  const serviceApiKey = serviceKey?.api_key ?? 'SUPABASE_CLIENT_SERVICE_KEY'

  const values: Record<string, string> = {
    vault_token: serviceApiKey,
    warehouse: bucketName,
    's3.endpoint': getConnectionURL(project?.ref ?? '', protocol, endpoint),
    catalog_uri: getCatalogURI(project?.ref ?? '', protocol, endpoint),
  }

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldHeader className="flex flex-row justify-between items-end gap-x-8">
        <div>
          <ScaffoldSectionTitle>Connection details</ScaffoldSectionTitle>
          <ScaffoldSectionDescription>
            Connect to this bucket from an Iceberg client.{' '}
            <InlineLink
              href={`${DOCS_URL}/guides/storage/analytics/connecting-to-analytics-bucket`}
            >
              Learn more
            </InlineLink>
          </ScaffoldSectionDescription>
        </div>
        <CopyEnvButton serverOptions={wrapperMeta.options} values={values} />
      </ScaffoldHeader>

      <Card>
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
    </ScaffoldSection>
  )
}
