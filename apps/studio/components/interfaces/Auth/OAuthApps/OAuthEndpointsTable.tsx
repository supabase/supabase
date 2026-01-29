import { useParams } from 'common'
import { useOpenIDConfigurationQuery } from 'data/oauth-server-apps/oauth-openid-configuration-query'
import { Card, CardContent, cn } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

interface OAuthEndpointsTableProps {
  /**
   * When true, the component is shown in a preview/disabled state with blurred values.
   * This is used when the OAuth server is toggled on but not yet saved.
   */
  isPreview?: boolean
  /**
   * External loading state passed from parent (e.g., when auth config is still loading)
   */
  isLoading?: boolean
  className?: string
}

export const OAuthEndpointsTable = ({
  isPreview = false,
  isLoading: isLoadingProp = false,
  className,
}: OAuthEndpointsTableProps) => {
  const { ref: projectRef } = useParams()

  const { data: openidConfig, isLoading: isEndpointsLoading } = useOpenIDConfigurationQuery(
    { projectRef },
    { enabled: !isPreview && !isLoadingProp }
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
    <PageSection className={cn(isPreview && 'opacity-60 pointer-events-none', className)}>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>OAuth Endpoints</PageSectionTitle>
          <PageSectionDescription>
            {isPreview
              ? 'Save changes to enable OAuth endpoints.'
              : 'Share these endpoints with third-party applications that need to integrate with your OAuth 2.1 server.'}
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
                  <Input
                    readOnly
                    copy={!isPreview}
                    disabled={isPreview}
                    value={isPreview ? '••••••••••••••••••••••••' : endpoint.value ?? ''}
                    className={cn(isPreview && 'select-none')}
                  />
                </FormItemLayout>
              ))
            )}
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
