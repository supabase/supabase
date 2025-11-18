import { AlertCircle, Loader2 } from 'lucide-react'
import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { DOCS_URL, IS_SELF_HOST } from 'lib/constants'
import { DocsButton } from '../DocsButton'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'

export const DisplayApiSettingsLocalState = ({
  showTitle = true,
  showNotice = true,
}: {
  showTitle?: boolean
  showNotice?: boolean
}) => {
  const { ref: projectRef } = useParams()

  const { data: apiKeys, isLoading, isError } = useAPIKeysQuery({ projectRef })
  // api keys should not be empty. However it can be populated with a delay on project creation
  const isApiKeysEmpty = apiKeys === undefined || apiKeys.length === 0

  return (
    <div className="flex flex-col gap-6">
      {IS_SELF_HOST && (
        <Card>
          <CardHeader>
            <CardTitle>Managing API Keys for self-hosted</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
            <div className="p-8">
              <div className="flex items-center gap-2">
                <h4 className="text-base text-foreground">Managing API Keys</h4>
              </div>

              <div className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
                <p className="prose [&>code]:text-xs space-x-1 text-sm max-w-full">
                  Local API Keys can be loaded through{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/supabase/supabase/blob/master/docker/.env.example"
                  >
                    .env file
                  </a>
                </p>
              </div>
              <DocsButton href={`${DOCS_URL}/guides/self-hosting/docker#update-api-keys`} />
            </div>
          </CardContent>
        </Card>
      )}
      <Panel
        noMargin
        title={
          showTitle && (
            <div className="space-y-3">
              <h5 className="text-base">Project API Keys</h5>
              <p className="text-sm text-foreground-light">
                Your API is secured behind an API gateway which requires an API Key for every
                request.
                <br />
                You can use the keys below in the Supabase client libraries.
                <br />
              </p>
            </div>
          )
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8 space-x-2">
            <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">Retrieving API keys</p>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-8 space-x-2">
            <AlertCircle size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">Failed to retrieve API keys</p>
          </div>
        ) : isApiKeysEmpty ? (
          <div className="flex items-center justify-center py-8 space-x-2">
            <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">Retrieving API keys</p>
          </div>
        ) : (
          apiKeys.map((x, i: number) => (
            <Panel.Content
              key={x.api_key}
              className={
                i >= 1 &&
                'border-t border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark'
              }
            >
              <FormLayout
                layout="horizontal"
                label={
                  <>
                    {x.name?.split(',').map((x, i: number) => (
                      <code key={`${x}${i}`} className="text-xs text-code">
                        {x}
                      </code>
                    ))}
                    {x.name === 'service_role' && (
                      <>
                        <code className="text-xs text-code !bg-destructive !text-white !border-destructive">
                          secret
                        </code>
                      </>
                    )}
                    {x.name === 'anon' && <code className="text-xs text-code">public</code>}
                  </>
                }
                description={
                  x.name === 'service_role' ? (
                    <>
                      This key has the ability to bypass Row Level Security. Never share it
                      publicly. If leaked, generate a new JWT secret immediately.{' '}
                    </>
                  ) : (
                    <>
                      This key is safe to use in a browser if you have enabled Row Level Security
                      for your tables and configured policies.{' '}
                    </>
                  )
                }
              >
                <Input
                  readOnly
                  className="font-mono"
                  copy
                  reveal={x.name !== 'anon'}
                  value={x?.api_key}
                  onChange={() => {}}
                />
              </FormLayout>
            </Panel.Content>
          ))
        )}
        {showNotice ? (
          <Panel.Notice
            className="border-t"
            title="API keys have moved"
            badgeLabel="Changelog"
            description={`
  \`anon\` and \`service_role\` API keys can now be replaced with \`publishable\` and \`secret\` API keys.
  `}
            href="https://github.com/orgs/supabase/discussions/29260"
            buttonText="Read the announcement"
          />
        ) : null}
      </Panel>
    </div>
  )
}
