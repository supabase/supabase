import { useParams } from 'common'

import CodeSnippet from './CodeSnippet'
import { DocSection } from './DocSection'
import PublicSchemaNotEnabledAlert from './PublicSchemaNotEnabledAlert'
import Snippets from '@/components/interfaces/Docs/Snippets'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'

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
    <DocSection
      title="Connect to your project"
      content={
        <>
          <p>
            All projects have a RESTful endpoint that you can use with your project's API key to
            query and manage your database. These can be obtained from the{' '}
            <InlineLink href={`/project/${projectRef}/integrations/data_api/overview`}>
              API settings
            </InlineLink>
            .
          </p>
          <p>
            You can initialize a new Supabase client using the <code>createClient()</code> method.
            The Supabase client is your entrypoint to the rest of the Supabase functionality and is
            the easiest way to interact with everything we offer within the Supabase ecosystem.
          </p>
        </>
      }
      snippets={
        <>
          <CodeSnippet selectedLang={selectedLang} snippet={Snippets.init(endpoint)} />
          {isSuccess && !isPublicSchemaEnabled && <PublicSchemaNotEnabledAlert />}
        </>
      }
    />
  )
}
