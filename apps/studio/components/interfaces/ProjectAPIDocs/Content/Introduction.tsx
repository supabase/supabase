import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, copyToClipboard } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import type { ContentProps } from './Content.types'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useTrack } from '@/lib/telemetry/track'

export const Introduction = ({ showKeys, language, apikey, endpoint }: ContentProps) => {
  const { ref } = useParams()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeysData } = useAPIKeys({ projectRef: ref }, { enabled: canReadAPIKeys })
  useProjectSettingsV2Query({ projectRef: ref })
  const { anonKey, serviceKey } = apiKeysData ?? {}

  const track = useTrack()

  const [copied, setCopied] = useState<'anon' | 'service'>()

  useEffect(() => {
    if (copied !== undefined) setTimeout(() => setCopied(undefined), 2000)
  }, [copied])

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
          <div className="flex flex-col space-x-4 mt-8">
            <FormItemLayout isReactForm={false} layout="horizontal" label="Project URL">
              <Input disabled readOnly copy size="small" value={endpoint} className="w-full" />
            </FormItemLayout>
          </div>
          <div className="flex flex-col space-x-4">
            <FormItemLayout
              isReactForm={false}
              layout="horizontal"
              label="Client API key"
              description="This key is safe to use in a browser if you have enabled Row Level Security (RLS) for your tables and configured policies."
            >
              <Input
                disabled
                readOnly
                size="small"
                value={showKeys ? apikey : 'Reveal API keys via dropdown in the header'}
                actions={[
                  <Button
                    key="copy"
                    variant="default"
                    icon={<Copy />}
                    onClick={() => {
                      setCopied('anon')
                      copyToClipboard(anonApiKey ?? 'SUPABASE_CLIENT_ANON_KEY')
                      track('api_docs_code_copy_button_clicked', {
                        title: 'Client API key',
                        selectedLanguage: language,
                      })
                    }}
                  >
                    {copied === 'anon' ? 'Copied' : 'Copy'}
                  </Button>,
                ]}
              />
            </FormItemLayout>
          </div>
          <div className="flex flex-col space-x-4">
            <FormItemLayout
              isReactForm={false}
              layout="horizontal"
              label="Service key"
              description={
                <p>
                  This key has the ability to bypass Row Level Security.{' '}
                  <span className="text-amber-900">Never share it publicly.</span>
                </p>
              }
            >
              <Input
                disabled
                readOnly
                size="small"
                value={
                  showKeys
                    ? (serviceApiKey ?? 'SUPABASE_CLIENT_SERVICE_KEY')
                    : 'Reveal API keys via dropdown in the header'
                }
                actions={[
                  <Button
                    key="copy"
                    variant="default"
                    icon={<Copy />}
                    onClick={() => {
                      setCopied('service')
                      copyToClipboard(serviceApiKey)
                      track('api_docs_code_copy_button_clicked', {
                        title: 'Service key',
                        selectedLanguage: language,
                      })
                    }}
                  >
                    {copied === 'service' ? 'Copied' : 'Copy'}
                  </Button>,
                ]}
              />
            </FormItemLayout>
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
