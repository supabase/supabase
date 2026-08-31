import { Card, CardContent, CardHeader, CardTitle } from 'ui'

import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

export function SettingsDatabaseEmptyStateLocal() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Local development & CLI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-light mb-4">
            Configure database settings in{' '}
            <code className="text-code-inline">supabase/config.toml</code> — applied automatically
            on <code className="text-code-inline">supabase start</code>.
          </p>
          <DocsButton href={`${DOCS_URL}/guides/local-development/cli/config#database-config`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Self-Hosted Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-light mb-4">
            Change settings in{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/supabase/supabase/blob/master/docker/.env.example"
            >
              .env file
            </a>{' '}
            and{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml"
            >
              docker-compose.yml
            </a>
            .
          </p>
          <DocsButton
            href={`${DOCS_URL}/guides/self-hosting/docker#configuring-and-securing-supabase`}
          />
        </CardContent>
      </Card>
    </>
  )
}
