import { useQuery } from '@tanstack/react-query'
import { Card } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  PageSection,
  PageSectionAside,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DESCRIPTIONS, LABELS, OPTION_ORDER } from './AnalyticsBucketDetails.constants'
import { CopyEnvButton } from './CopyEnvButton'
import { DecryptedReadOnlyInput } from './DecryptedReadOnlyInput'
import { UpdateCatalogTokenDialog } from './UpdateCatalogTokenDialog'
import { useAnalyticsBucketWrapperInstance } from './useAnalyticsBucketWrapperInstance'
import { INTEGRATIONS } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { WrapperMeta } from '@/components/interfaces/Integrations/Wrappers/Wrappers.types'
import { convertKVStringArrayToJson } from '@/components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ApiKeysAccessNote } from '@/components/ui/ApiKeysAccessNote'
import { InlineLink } from '@/components/ui/InlineLink'
import { getKeys, revealedApiKeysQueryOptions } from '@/data/api-keys/api-keys-query'
import { useVaultSecretDecryptedValueQuery } from '@/data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import { useGrant } from '@/lib/grants'

export const SimpleConfigurationDetails = ({ bucketName }: { bucketName?: string }) => {
  const { data: project } = useSelectedProjectQuery()
  const apiKeysGrant = useGrant(
    'GET /v1/projects/{ref}/api-keys',
    { projectRef: project?.ref },
    { variant: 'reveal' }
  )
  const canReadAPIKeys = apiKeysGrant.status === 'granted'

  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper' && i.type === 'wrapper')
  const wrapperMeta = (integration?.type === 'wrapper' && integration.meta) as WrapperMeta

  /** The wrapper instance is the wrapper that is installed for this Analytics bucket. */
  const { data: wrapperInstance } = useAnalyticsBucketWrapperInstance({ bucketId: bucketName })
  const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])

  const { data: decryptedToken, isSuccess: isSuccessVaultDecrypt } =
    useVaultSecretDecryptedValueQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        id: wrapperValues?.vault_token,
      },
      { enabled: canReadAPIKeys }
    )

  const { data: apiKeysData, isSuccess: isSuccessApiKeys } = useQuery(
    revealedApiKeysQueryOptions(
      { projectRef: project?.ref, grant: apiKeysGrant.grant },
      { select: getKeys }
    )
  )

  const isTokenValid = apiKeysData?.allSecretKeys.some((x) => x.api_key === decryptedToken)

  if (!wrapperInstance) return null

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Connection details</PageSectionTitle>
          <PageSectionDescription>
            Connect to this bucket from an Iceberg client.{' '}
            <InlineLink
              href={`${DOCS_URL}/guides/storage/analytics/connecting-to-analytics-bucket`}
            >
              Learn more
            </InlineLink>
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <CopyEnvButton
            serverOptions={wrapperMeta.server.options.filter(
              (option) => !option.hidden && wrapperValues[option.name]
            )}
            values={wrapperValues}
          />
        </PageSectionAside>
      </PageSectionMeta>

      <ApiKeysAccessNote
        grant={apiKeysGrant}
        fallback="We can't check whether the catalog token is still valid."
      />
      {isSuccessApiKeys && isSuccessVaultDecrypt && !isTokenValid && (
        <Admonition type="warning" title="Catalog token is no longer valid">
          <p>
            The Iceberg wrapper's catalog token doesn't match with any of your project's API keys,
            and hence authorization will fail when connecting to your bucket. Update the catalog
            token to use any of your project's API keys.
          </p>
          {canReadAPIKeys && <UpdateCatalogTokenDialog vaultTokenId={wrapperValues?.vault_token} />}
        </Admonition>
      )}

      <Card>
        {wrapperMeta.server.options
          .filter((option) => !option.hidden && wrapperValues[option.name])
          .sort((a, b) => OPTION_ORDER.indexOf(a.name) - OPTION_ORDER.indexOf(b.name))
          .map((option) => {
            return (
              <DecryptedReadOnlyInput
                key={option.name}
                label={LABELS[option.name]}
                value={wrapperValues[option.name]}
                secureEntry={option.secureEntry}
                descriptionText={DESCRIPTIONS[option.name]}
              />
            )
          })}
      </Card>
    </PageSection>
  )
}
