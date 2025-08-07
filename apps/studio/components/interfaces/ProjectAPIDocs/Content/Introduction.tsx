import { useParams } from 'common'
import { Button, Input, copyToClipboard } from 'ui'

import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import type { ContentProps } from './Content.types'

const Introduction = ({ showKeys, language, apikey, endpoint }: ContentProps) => {
  const { ref } = useParams()
  const { data: apiKeys } = useAPIKeysQuery({ projectRef: ref })
  const { data } = useProjectSettingsV2Query({ projectRef: ref })

  const [copied, setCopied] = useState<'anon' | 'service'>()

  useEffect(() => {
    if (copied !== undefined) setTimeout(() => setCopied(undefined), 2000)
  }, [copied])

  const { anonKey, serviceKey } = getKeys(apiKeys)
  const anonApiKey = anonKey?.api_key
  const serviceApiKey = serviceKey?.api_key ?? 'SUPABASE_CLIENT_SERVICE_KEY'

  return (
    <>
      <ContentSnippet
        selectedLanguage={language}
        apikey={apikey}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.init}
      >
        <div className="px-4 space-y-6">
          <div className="flex space-x-4 mt-8">
            <p className="text-sm w-40">Project URL</p>
            <Input disabled readOnly copy size="small" value={endpoint} className="w-full" />
          </div>
          <div className="flex space-x-4">
            <p className="text-sm w-40">Client API key</p>
            <Input
              disabled
              readOnly
              size="small"
              value={showKeys ? apikey : 'Reveal API keys via dropdown in the header'}
              className="w-full"
              descriptionText="This key is safe to use in a browser if you have enabled Row Level Security (RLS) for your tables and configured policies."
              actions={[
                <Button
                  key="copy"
                  type="default"
                  icon={<Copy />}
                  onClick={() => {
                    setCopied('anon')
                    copyToClipboard(anonApiKey ?? 'SUPABASE_CLIENT_ANON_KEY')
                  }}
                >
                  {copied === 'anon' ? 'Copied' : 'Copy'}
                </Button>,
              ]}
            />
          </div>
          <div className="flex space-x-4">
            <p className="text-sm w-40 mb-16">Service key</p>
            <Input
              disabled
              readOnly
              size="small"
              value={
                showKeys
                  ? serviceApiKey ?? 'SUPABASE_CLIENT_SERVICE_KEY'
                  : 'Reveal API keys via dropdown in the header'
              }
              className="w-full"
              descriptionText={
                <p>
                  This key has the ability to bypass Row Level Security.{' '}
                  <span className="text-amber-900">Never share it publicly.</span>
                </p>
              }
              actions={[
                <Button
                  key="copy"
                  type="default"
                  icon={<Copy />}
                  onClick={() => {
                    setCopied('service')
                    copyToClipboard(serviceApiKey)
                  }}
                >
                  {copied === 'service' ? 'Copied' : 'Copy'}
                </Button>,
              ]}
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
        apikey={showKeys ? serviceApiKey : 'SUPABASE_CLIENT_SERVICE_KEY'}
        endpoint={endpoint}
        snippet={DOCS_CONTENT.serviceApiKeys}
      />
    </>
  )
}

export default Introduction
