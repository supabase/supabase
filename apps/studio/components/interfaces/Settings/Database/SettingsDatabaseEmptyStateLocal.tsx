import { Card, CardContent, CardHeader } from 'ui'
import { DOCS_URL } from 'lib/constants'
import { DocsButton } from 'components/ui/DocsButton'

export function SettingsDatabaseEmptyStateLocal() {
  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          Local development & CLI
          <div className="flex items-center gap-x-2">
            <DocsButton href={`${DOCS_URL}/guides/local-development/cli/config#database-config`} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="prose [&>code]:text-xs text-sm max-w-full">
            Change settings in <code>supabase/config.toml</code> file, which is automatically loaded
            on <code>supabase start</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          Self-Hosted Supabase
          <div className="flex items-center gap-x-2">
            <DocsButton
              href={`${DOCS_URL}/guides/self-hosting/docker#configuring-and-securing-supabase`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="prose [&>code]:text-xs space-x-1 text-sm max-w-full">
            <span>Change settings in</span>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/supabase/supabase/blob/master/docker/.env.example"
            >
              .env file
            </a>
            <span>and</span>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml"
            >
              docker-compose.yml
            </a>
          </p>
        </CardContent>
      </Card>
    </>
  )
}
