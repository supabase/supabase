import { useParams } from 'common'
import Snippets from 'components/interfaces/Docs/Snippets'
import type { AutoApiService } from 'data/config/project-api-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'

import CodeSnippet from './CodeSnippet'
import PublicSchemaNotEnabledAlert from './PublicSchemaNotEnabledAlert'

interface Props {
  autoApiService: AutoApiService
  selectedLang: 'bash' | 'js'
}

export default function Introduction({ autoApiService, selectedLang }: Props) {
  const { ref: projectRef } = useParams()

  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })

  const isPublicSchemaEnabled = config?.db_schema
    .split(',')
    .map((name) => name.trim())
    .includes('public')

  return (
    <div className="doc-section doc-section--client-libraries">
      <article className="code">
        <CodeSnippet selectedLang={selectedLang} snippet={Snippets.init(autoApiService.endpoint)} />

        {!isPublicSchemaEnabled && <PublicSchemaNotEnabledAlert />}
      </article>
    </div>
  )
}
