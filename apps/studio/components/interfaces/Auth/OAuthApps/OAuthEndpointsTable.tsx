import { useParams } from 'common'
import { Card, CardContent, cn } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { useOpenIDConfigurationQuery } from '@/data/oauth-server-apps/oauth-openid-configuration-query'

interface OAuthEndpointsTableProps {
  isLoading?: boolean
  className?: string
}

export const OAuthEndpointsTable = ({
  isLoading: isLoadingProp = false,
  className,
}: OAuthEndpointsTableProps) => {
  const { ref: projectRef } = useParams()

  const { data: openidConfig, isLoading: isEndpointsLoading } = useOpenIDConfigurationQuery(
    { projectRef },
    { enabled: !isLoadingProp }
  )

  const isLoading = isLoadingProp || isEndpointsLoading

  const endpoints = [
    {
      name: 'Authorization endpoint',
      value: openidConfig?.authorization_endpoint,
    },
    {
      name: 'Token endpoint',
      value: openidConfig?.token_endpoint,
    },
    {
      name: 'JWKS endpoint',
      value: openidConfig?.jwks_uri,
    },
    {
      name: 'OIDC discovery',
      value: openidConfig?.issuer
        ? `${openidConfig.issuer}/.well-known/openid-configuration`
        : undefined,
    },
  ]

  return (
    <PageSection className={cn(className)}>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>OAuth Endpoints</PageSectionTitle>
          <PageSectionDescription>
            Share these endpoints with third-party applications that need to integrate with your
            OAuth 2.1 server.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="flex flex-col gap-4 pt-0 divide-y">
            {isLoading ? (
              <GenericSkeletonLoader className="mt-4" />
            ) : (
              endpoints.map((endpoint) => (
                <FormItemLayout
                  key={endpoint.name}
                  layout="horizontal"
                  isReactForm={false}
                  label={endpoint.name}
                  className="mt-4"
                >
                  <Input readOnly copy value={endpoint.value ?? ''} />
                </FormItemLayout>
              ))
            )}
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
