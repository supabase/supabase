import { useParams } from 'common'
import Snippets from 'components/interfaces/Docs/Snippets'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'

import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import CodeSnippet from './CodeSnippet'
import PublicSchemaNotEnabledAlert from './PublicSchemaNotEnabledAlert'

interface Props {
  selectedLang: 'bash' | 'js'
}

export default function Introduction({ selectedLang }: Props) {
  const { ref: projectRef } = useParams()

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint
  const endpoint = `${protocol}://${hostEndpoint ?? ''}`

  const isPublicSchemaEnabled = config?.db_schema
    .split(',')
    .map((name) => name.trim())
    .includes('public')

  return (
    <div className="doc-section doc-section--client-libraries">
      <article className="code">
        <CodeSnippet selectedLang={selectedLang} snippet={Snippets.init(endpoint)} />

        {!isPublicSchemaEnabled && <PublicSchemaNotEnabledAlert />}
      </article>
    </div>
  )
}
