import { useParams } from 'common'
import { IS_PLATFORM } from 'lib/constants'
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

interface OAuthEndpointsTableProps {
  /**
   * When true, the component is shown in a preview/disabled state with blurred values.
   * This is used when the OAuth server is toggled on but not yet saved.
   */
  isPreview?: boolean
}

export const OAuthEndpointsTable = ({ isPreview = false }: OAuthEndpointsTableProps) => {
  const { ref: projectRef } = useParams()
  const baseUrl = IS_PLATFORM ? `https://${projectRef}.supabase.co` : 'http://localhost:54321'
  const endpoints = [
    {
      name: 'Authorization endpoint',
      path: '/auth/v1/oauth/authorize',
    },
    {
      name: 'Token endpoint',
      path: '/auth/v1/oauth/token',
    },
    {
      name: 'JWKS endpoint',
      path: '/auth/v1/.well-known/jwks.json',
    },
    {
      name: 'Discovery endpoint',
      path: '/.well-known/oauth-authorization-server/auth/v1',
    },
    {
      name: 'OIDC discovery',
      path: '/auth/v1/.well-known/openid-configuration',
    },
  ]

  return (
    <PageSection className={cn(isPreview && 'opacity-60 pointer-events-none')}>
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
            {endpoints.map((endpoint) => (
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
                  value={isPreview ? '••••••••••••••••••••••••' : `${baseUrl}${endpoint.path}`}
                  className={cn(isPreview && 'select-none')}
                />
              </FormItemLayout>
            ))}
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
