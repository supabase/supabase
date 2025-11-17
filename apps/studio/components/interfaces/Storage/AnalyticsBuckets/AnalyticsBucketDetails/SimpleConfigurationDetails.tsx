import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { convertKVStringArrayToJson } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import {
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { InlineLink } from 'components/ui/InlineLink'
import { DOCS_URL } from 'lib/constants'
import { Card } from 'ui'
import { DESCRIPTIONS, LABELS, OPTION_ORDER } from './AnalyticsBucketDetails.constants'
import { CopyEnvButton } from './CopyEnvButton'
import { DecryptedReadOnlyInput } from './DecryptedReadOnlyInput'
import { useAnalyticsBucketWrapperInstance } from './useAnalyticsBucketWrapperInstance'

export const SimpleConfigurationDetails = ({ bucketName }: { bucketName?: string }) => {
  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper' && i.type === 'wrapper')
  const wrapperMeta = (integration?.type === 'wrapper' && integration.meta) as WrapperMeta

  /** The wrapper instance is the wrapper that is installed for this Analytics bucket. */
  const { data: wrapperInstance } = useAnalyticsBucketWrapperInstance({ bucketId: bucketName })
  const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])

  if (!wrapperInstance) return null

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldHeader className="flex flex-row justify-between items-end gap-x-8 pt-0">
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
        <CopyEnvButton
          serverOptions={wrapperMeta.server.options.filter(
            (option) => !option.hidden && wrapperValues[option.name]
          )}
          values={wrapperValues}
        />
      </ScaffoldHeader>

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
    </ScaffoldSection>
  )
}
