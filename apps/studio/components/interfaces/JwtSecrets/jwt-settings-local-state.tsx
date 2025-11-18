import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import Panel from 'components/ui/Panel'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { DOCS_URL, IS_LOCAL_CLI } from 'lib/constants'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Input, InputNumber } from 'ui'

const JWTSettingsLocalState = () => {
  const { ref: projectRef } = useParams()

  const { data: config, isError } = useProjectPostgrestConfigQuery({ projectRef })
  const { data: authConfig } = useAuthConfigQuery({ projectRef })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Managing JWT Keys {IS_LOCAL_CLI ? 'locally' : 'for self-hosted'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
          <div className="p-8">
            <div className="flex items-center gap-2">
              <h4 className="text-base text-foreground">Managing settings</h4>
            </div>

            <div className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
              <p className="prose [&>code]:text-xs space-x-1 text-sm max-w-full">
                Local JWT config can be loaded through{' '}
                {IS_LOCAL_CLI ? (
                  <span>
                    <code>config.toml</code> file placed at <code>supabase/config.toml</code>, which
                    is automatically loaded on <code>supabase start</code>
                  </span>
                ) : (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/supabase/supabase/blob/master/docker/.env.example"
                  >
                    .env file
                  </a>
                )}
              </p>
            </div>

            {IS_LOCAL_CLI ? (
              <DocsButton
                href={`${DOCS_URL}/guides/local-development/cli/config#auth.jwt_expiry`}
              />
            ) : (
              <DocsButton href={`${DOCS_URL}/guides/self-hosting/docker#update-secrets`} />
            )}
          </div>
        </CardContent>
      </Card>
      <Panel>
        <Panel.Content className="space-y-6 border-t border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark">
          {isError ? (
            <div className="flex items-center justify-center py-8 space-x-2">
              <AlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-foreground-light">Failed to retrieve JWT settings</p>
            </div>
          ) : (
            <>
              <Input
                label={'Legacy JWT secret'}
                readOnly
                copy
                reveal
                disabled
                value={config?.jwt_secret || ''}
                className="input-mono"
                descriptionText="Used to sign and verify JWTs issued by Supabase Auth"
                layout="horizontal"
              />

              <InputNumber
                id="JWT_EXP"
                name="JWT_EXP"
                size="small"
                label="Access token expiry time"
                value={authConfig?.JWT_EXP ?? 3600}
                descriptionText="How long access tokens are valid for before a refresh token has to be used. Recommendation: 3600 (1 hour)."
                layout="horizontal"
                actions={<span className="mr-3 text-foreground-lighter">seconds</span>}
                disabled
                readOnly
              />
            </>
          )}
        </Panel.Content>
      </Panel>
    </>
  )
}

export default JWTSettingsLocalState
