import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import { DOCS_URL } from 'lib/constants'
import { DocsButton } from 'components/ui/DocsButton'

export function SettingsDatabaseEmptyStateLocal() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Managing database settings locally</CardTitle>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
        <div className="p-8">
          <div className="flex items-center gap-2">
            <h4 className="text-base text-foreground">Managing settings</h4>
          </div>
          <div className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
            <p>Local database config can be loaded in either of the following two ways</p>
            <ul className="list-disc pl-6">
              <li className="prose [&>code]:text-xs text-sm max-w-full">
                Through <code>config.toml</code> file placed at <code>supabase/config.toml</code>,
                which is automatically loaded on <code>supabase start</code>
              </li>
              <li className="prose [&>code]:text-xs space-x-1 text-sm max-w-full">
                <span>Through</span>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/supabase/supabase/blob/master/docker/.env.example"
                >
                  .env file
                </a>
                <span>option when self-hosting</span>
              </li>
            </ul>
          </div>

          <DocsButton href={`${DOCS_URL}/guides/local-development/cli/config#database-config`} />
        </div>
      </CardContent>
    </Card>
  )
}
