import { Button, IconExternalLink, Input } from 'ui'
import { useParams } from 'common'

import { Markdown } from 'components/interfaces/Markdown'
import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'
import { useProjectApiQuery } from 'data/config/project-api-query'

const Introduction = ({ showKeys, language, apikey, endpoint }: ContentProps) => {
  const { ref } = useParams()
  const { data } = useProjectApiQuery({ projectRef: ref })

  const serviceKey = showKeys
    ? data?.autoApiService.serviceApiKey ?? 'SUPABASE_CLIENT_SERVICE_KEY'
    : 'SUPABASE_CLIENT_SERVICE_KEY'

  return (
    <>
      {/* <div id="connecting-project" className="space-y-4 py-6 pb-2 last:pb-6">
        <div className="px-4 space-y-2">
          <h2 className="doc-heading">Connecting to your project</h2>
          <div className="doc-section">
            <article className="text text-sm text-light">
              <Markdown
                className="max-w-none [&>p]:!my-2"
                content={`
Interact with your database through the [Supabase client libraries](https://supabase.com/docs/reference) with your API keys.
              `}
              />
            </article>
          </div>
          <div className="!mt-6 space-y-4">
            <Input
              disabled
              readOnly
              copy
              size="small"
              label="Project URL"
              value={endpoint}
              descriptionText="A RESTful endpoint for querying and managing your database"
            />
            <Input
              disabled
              readOnly
              copy
              size="small"
              label={
                <p>
                  API key
                  <code className="text-xs ml-2">anon</code>
                  <code className="text-xs">public</code>
                </p>
              }
              value={apikey}
              descriptionText="This key is safe to use in a browser if you have enabled Row Level Security (RLS) for your tables and configured policies. You may also use the service key which can be found here to bypass RLS."
            />
          </div>
        </div>
      </div> */}
      <ContentSnippet
        selectedLanguage={language}
        apikey={apikey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.init}
      >
        <div className="px-4 space-y-4">
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
            <p className="text-sm w-40">Service key</p>
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
