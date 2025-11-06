import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import { DOCS_URL, IS_LOCAL_CLI } from 'lib/constants'
import { DocsButton } from 'components/ui/DocsButton'

export function SettingsDatabaseEmptyStateLocal() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Managing database settings {IS_LOCAL_CLI ? 'locally' : 'for self-hosted'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
        <div className="p-8">
          <div className="flex items-center gap-2">
            <h4 className="text-base text-foreground">Managing settings</h4>
          </div>

          <div className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
            <p className="prose [&>code]:text-xs space-x-1 text-sm max-w-full">
              Local database config can be loaded through{' '}
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
            <DocsButton href={`${DOCS_URL}/guides/local-development/cli/config#database-config`} />
          ) : (
            <DocsButton href={`${DOCS_URL}/guides/self-hosting`} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
