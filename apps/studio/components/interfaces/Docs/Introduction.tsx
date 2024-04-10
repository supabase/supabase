import type { AutoApiService } from 'data/config/project-api-query'
import Snippets from 'components/interfaces/Docs/Snippets'
import CodeSnippet from './CodeSnippet'
import Link from 'next/link'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useParams } from 'common'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import PublicSchemaNotEnabledAlert from '../Settings/API/PublicSchemaNotEnabledAlert'

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

        {!isPublicSchemaEnabled && <PublicSchemaNotEnabledAlert context="docs" />}
      </article>
    </div>
  )
}
