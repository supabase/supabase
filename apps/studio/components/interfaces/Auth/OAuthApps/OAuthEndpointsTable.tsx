import { useParams } from 'common'
import { IS_PLATFORM } from 'lib/constants'
import { Card, CardContent } from 'ui'
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

export const OAuthEndpointsTable = () => {
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
    <PageSection>
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
            {endpoints.map((endpoint) => (
              <FormItemLayout
                key={endpoint.name}
                layout="horizontal"
                isReactForm={false}
                label={endpoint.name}
                className="mt-4"
              >
                <Input readOnly copy value={`${baseUrl}${endpoint.path}`} />
              </FormItemLayout>
            ))}
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
