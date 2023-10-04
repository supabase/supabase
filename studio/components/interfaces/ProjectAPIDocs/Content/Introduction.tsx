import { useParams } from 'common'
import { Input } from 'ui'

import { useProjectApiQuery } from 'data/config/project-api-query'
import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'

const Introduction = ({ showKeys, language, apikey, endpoint }: ContentProps) => {
  const { ref } = useParams()
  const { data } = useProjectApiQuery({ projectRef: ref })

  const serviceKey = showKeys
    ? data?.autoApiService.serviceApiKey ?? 'SUPABASE_CLIENT_SERVICE_KEY'
    : 'SUPABASE_CLIENT_SERVICE_KEY'

  return (
    <>
      <ContentSnippet
        selectedLanguage={language}
        apikey={apikey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.init}
      >
        <div className="px-4 space-y-6">
          <div className="flex space-x-4">
            <p className="text-sm w-40">Project URL</p>
            <Input disabled readOnly copy size="small" value={endpoint} className="w-full" />
          </div>
          <div className="flex space-x-4">
            <p className="text-sm w-40">Client API key</p>
            <Input
              disabled
              readOnly
              copy
              size="small"
              value={apikey}
              className="w-full"
              descriptionText="This key is safe to use in a browser if you have enabled Row Level Security (RLS) for your tables and configured policies. You may also use the service key which can be found here to bypass RLS."
            />
          </div>
          <div className="flex space-x-4">
            <p className="text-sm w-40 mb-16">Service key</p>
            <Input
              disabled
              readOnly
              copy
              size="small"
              value={serviceKey}
              className="w-full"
              descriptionText={
                <p>
                  This key has the ability to bypass Row Level Security.{' '}
                  <span className="text-amber-900">Never share it publicly.</span>
                </p>
              }
            />
          </div>
        </div>
      </ContentSnippet>

      <ContentSnippet
        selectedLanguage={language}
        apikey={apikey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.clientApiKeys}
      />

      <ContentSnippet
        selectedLanguage={language}
        apikey={serviceKey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.serviceApiKeys}
      />
    </>
  )
}

export default Introduction
