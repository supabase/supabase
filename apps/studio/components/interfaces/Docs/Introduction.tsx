import { useParams } from 'common'
import Snippets from 'components/interfaces/Docs/Snippets'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'

import { InlineLink } from 'components/ui/InlineLink'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import CodeSnippet from './CodeSnippet'
import PublicSchemaNotEnabledAlert from './PublicSchemaNotEnabledAlert'

interface Props {
  selectedLang: 'bash' | 'js'
}

export default function Introduction({ selectedLang }: Props) {
  const { ref: projectRef } = useParams()

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: config, isSuccess } = useProjectPostgrestConfigQuery({ projectRef })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint
  const endpoint = `${protocol}://${hostEndpoint ?? ''}`

  const isPublicSchemaEnabled = config?.db_schema
    .split(',')
    .map((name) => name.trim())
    .includes('public')

  return (
    <>
      <h2 className="doc-heading">Connect to your project</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            All projects have a RESTful endpoint that you can use with your project's API key to
            query and manage your database. These can be obtained from the{' '}
            <InlineLink href={`/project/${projectRef}/settings/api`}>API settings</InlineLink>.
          </p>
          <p>
            You can initialize a new Supabase client using the <code>createClient()</code> method.
            The Supabase client is your entrypoint to the rest of the Supabase functionality and is
            the easiest way to interact with everything we offer within the Supabase ecosystem.
          </p>
        </article>
        <article className="code flex flex-col gap-y-2">
          <CodeSnippet selectedLang={selectedLang} snippet={Snippets.init(endpoint)} />
          {isSuccess && !isPublicSchemaEnabled && <PublicSchemaNotEnabledAlert />}
        </article>
      </div>
    </>
  )
}
