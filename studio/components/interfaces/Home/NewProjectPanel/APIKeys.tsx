import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Input, IconLoader, IconAlertCircle } from 'ui'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { checkPermissions, useJwtSecretUpdateStatus } from 'hooks'
import Snippets from 'components/to-be-cleaned/Docs/Snippets'
import Panel from 'components/ui/Panel'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const APIKeys = () => {
  const router = useRouter()
  const { ref } = router.query

  const availableLanguages = [
    { name: 'Javascript', key: 'js' },
    { name: 'Dart', key: 'dart' },
  ]
  const [selectedLanguage, setSelectedLanguage] = useState(availableLanguages[0])

  const {
    data: settings,
    isError: isProjectSettingsError,
    isLoading: isProjectSettingsLoading,
  } = useProjectSettingsQuery({ projectRef: ref as string })

  const {
    jwtSecretUpdateStatus,
    isError: isJwtSecretUpdateStatusError,
    isLoading: isJwtSecretUpdateStatusLoading,
  }: any = useJwtSecretUpdateStatus(ref)

  const canReadAPIKeys = checkPermissions(PermissionAction.READ, 'service_api_keys')

  // Get the API service
  const apiService = settings?.autoApiService
  const apiKeys = apiService?.service_api_keys ?? []

  // API keys should not be empty. However it can be populated with a delay on project creation
  const isApiKeysEmpty = apiKeys.length === 0
  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated

  const apiUrl = `${apiService?.protocol ?? 'https'}://${apiService?.endpoint ?? '-'}`
  const anonKey = apiKeys.find((key: any) => key.tags === 'anon')

  const clientInitSnippet: any = Snippets.init(apiUrl)
  const selectedLanguageSnippet =
    clientInitSnippet[selectedLanguage.key]?.code ?? 'No snippet available'

  return (
    <Panel
      title={
        <div className="space-y-3">
          <h5 className="text-base">Project API</h5>
          <p className="text-sm text-scale-1000">
            Your API is secured behind an API gateway which requires an API Key for every request.
            <br />
            You can use the parameters below to use Supabase client libraries.
          </p>
        </div>
      }
    >
      {isProjectSettingsError || isJwtSecretUpdateStatusError ? (
        <div className="py-8 flex items-center justify-center space-x-2">
          <IconAlertCircle size={16} strokeWidth={1.5} />
          <p className="text-sm text-scale-1100">
            {isProjectSettingsError ? 'Failed to retrieve API keys' : 'Failed to update JWT secret'}
          </p>
        </div>
      ) : isApiKeysEmpty || isProjectSettingsLoading || isJwtSecretUpdateStatusLoading ? (
        <div className="py-8 flex items-center justify-center space-x-2">
          <IconLoader className="animate-spin" size={16} strokeWidth={1.5} />
          <p className="text-sm text-scale-1100">
            {isProjectSettingsLoading || isApiKeysEmpty
              ? 'Retrieving API keys'
              : 'JWT secret is being updated'}
          </p>
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
                    {anonKey?.tags?.split(',').map((x: any, i: number) => (
                      <code key={`${x}${i}`} className="text-xs">
                        {x}
                      </code>
                    ))}
                    <code className="text-xs">{'public'}</code>
                  </div>
                </div>
              }
              copy={canReadAPIKeys && isNotUpdatingJwtSecret}
              reveal={anonKey?.tags !== 'anon' && canReadAPIKeys && isNotUpdatingJwtSecret}
              value={
                !canReadAPIKeys
                  ? 'You need additional permissions to view API keys'
                  : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Failed
                  ? 'JWT secret update failed, new API key may have issues'
                  : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating
                  ? 'Updating JWT secret...'
                  : apiService?.defaultApiKey
              }
              onChange={() => {}}
              descriptionText={
                <p>
                  This key is safe to use in a browser if you have enabled Row Level Security (RLS)
                  for your tables and configured policies. You may also use the service key which
                  can be found{' '}
                  <Link href={`/project/${ref}/settings/api`}>
                    <a className="text-brand-800 hover:text-brand-900 transition">here</a>
                  </Link>{' '}
                  to bypass RLS.
                </p>
              }
            />
          </Panel.Content>
          <div className="border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
            <div className="flex items-center bg-scale-200">
              {availableLanguages.map((language) => {
                const isSelected = selectedLanguage.key === language.key
                return (
                  <div
                    key={language.key}
                    className={[
                      'px-3 py-1 text-sm cursor-pointer transition',
                      `${!isSelected ? 'bg-scale-200 text-scale-1000' : 'bg-scale-300'}`,
                    ].join(' ')}
                    onClick={() => setSelectedLanguage(language)}
                  >
                    {language.name}
                  </div>
                )
              })}
            </div>
            <div className="bg-scale-300 px-4 py-6 min-h-[200px]">
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
