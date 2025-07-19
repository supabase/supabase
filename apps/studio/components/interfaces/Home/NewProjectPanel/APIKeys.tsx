import { PermissionAction } from '@supabase/shared-types/out/constants'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { AlertCircle, Loader } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Input, SimpleCodeBlock } from 'ui'

const generateInitSnippet = (endpoint: string) => ({
  js: `
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${endpoint}'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)`,
  dart: `
const supabaseUrl = '${endpoint}';
const supabaseKey = String.fromEnvironment('SUPABASE_KEY');

Future<void> main() async {
  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseKey);
  runApp(MyApp());
}`,
})

const APIKeys = () => {
  const { ref: projectRef } = useParams()

  const availableLanguages = [
    { name: 'Javascript', key: 'js' },
    { name: 'Dart', key: 'dart' },
  ]
  const [selectedLanguage, setSelectedLanguage] = useState(availableLanguages[0])

  const {
    data: settings,
    isError: isProjectSettingsError,
    isLoading: isProjectSettingsLoading,
  } = useProjectSettingsV2Query({ projectRef })

  const { data: apiKeys } = useAPIKeysQuery({ projectRef })
  const { anonKey, serviceKey } = getKeys(apiKeys)

  // API keys should not be empty. However it can be populated with a delay on project creation
  const isApiKeysEmpty = !anonKey && !serviceKey

  const {
    data,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
  } = useJwtSecretUpdatingStatusQuery(
    { projectRef },
    { enabled: !isProjectSettingsLoading && isApiKeysEmpty }
  )

  // Only show JWT loading state if the query is actually enabled
  const showJwtLoading =
    isJwtSecretUpdateStatusLoading && !isProjectSettingsLoading && isApiKeysEmpty

  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus

  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = `${protocol}://${endpoint ?? '-'}`

  const clientInitSnippet: any = generateInitSnippet(apiUrl)
  const selectedLanguageSnippet = clientInitSnippet[selectedLanguage.key] ?? 'No snippet available'

  return (
    <Panel
      title={
        <div className="space-y-3">
          <h5 className="text-base">Project API</h5>
          <p className="text-sm text-foreground-light">
            Your API is secured behind an API gateway which requires an API Key for every request.
            <br />
            You can use the parameters below to use Supabase client libraries.
          </p>
        </div>
      }
    >
      {isProjectSettingsError || isJwtSecretUpdateStatusError ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <AlertCircle size={16} strokeWidth={1.5} />
          <p className="text-sm text-foreground-light">
            {isProjectSettingsError ? 'Failed to retrieve API keys' : 'Failed to update JWT secret'}
          </p>
        </div>
      ) : isProjectSettingsLoading ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <Loader className="animate-spin" size={16} strokeWidth={1.5} />
          <p className="text-sm text-foreground-light">Retrieving API keys</p>
        </div>
      ) : isApiKeysEmpty ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <Loader className="animate-spin" size={16} strokeWidth={1.5} />
          <p className="text-sm text-foreground-light">Retrieving API keys</p>
        </div>
      ) : showJwtLoading ? (
        <div className="flex items-center justify-center py-8 space-x-2">
          <Loader className="animate-spin" size={16} strokeWidth={1.5} />
          <p className="text-sm text-foreground-light">JWT secret is being updated</p>
        </div>
      ) : (
        <>
          <Panel.Content>
            <Input
              label="Project URL"
              readOnly
              copy
              disabled
              className="input-mono"
              value={apiUrl}
              descriptionText="A RESTful endpoint for querying and managing your database."
              layout="horizontal"
            />
          </Panel.Content>
          <Panel.Content
            className={
              'border-t border-panel-border-interior-light dark:border-panel-border-interior-dark'
            }
          >
            <Input
              readOnly
              disabled
              layout="horizontal"
              className="input-mono"
              // @ts-ignore
              label={
                <div className="space-y-2">
                  <p className="text-sm">API Key</p>
                  <div className="flex items-center space-x-1 -ml-1">
                    <code className="text-xs">{anonKey?.name}</code>
                    <code className="text-xs">public</code>
                  </div>
                </div>
              }
              copy={canReadAPIKeys && isNotUpdatingJwtSecret}
              reveal={anonKey?.name !== 'anon' && canReadAPIKeys && isNotUpdatingJwtSecret}
              value={
                !canReadAPIKeys
                  ? 'You need additional permissions to view API keys'
                  : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Failed
                    ? 'JWT secret update failed, new API key may have issues'
                    : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating
                      ? 'Updating JWT secret...'
                      : anonKey?.api_key
              }
              onChange={() => {}}
              descriptionText={
                <p>
                  This key is safe to use in a browser if you have enabled Row Level Security (RLS)
                  for your tables and configured policies. You may also use the service key which
                  can be found{' '}
                  <Link
                    href={`/project/${projectRef}/settings/api`}
                    className="transition text-brand hover:text-brand-600"
                  >
                    here
                  </Link>{' '}
                  to bypass RLS.
                </p>
              }
            />
          </Panel.Content>
          <div className="border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
            <div className="flex items-center bg-studio">
              {availableLanguages.map((language) => {
                const isSelected = selectedLanguage.key === language.key
                return (
                  <div
                    key={language.key}
                    className={[
                      'px-3 py-1 text-sm cursor-pointer transition',
                      `${!isSelected ? 'bg-studio text-foreground-light' : 'bg-surface-100'}`,
                    ].join(' ')}
                    onClick={() => setSelectedLanguage(language)}
                  >
                    {language.name}
                  </div>
                )
              })}
            </div>
            <div className="bg-surface-100 px-4 py-6 min-h-[200px]">
              <SimpleCodeBlock className={selectedLanguage.key}>
                {selectedLanguageSnippet}
              </SimpleCodeBlock>
            </div>
          </div>
        </>
      )}
    </Panel>
  )
}

export default APIKeys
