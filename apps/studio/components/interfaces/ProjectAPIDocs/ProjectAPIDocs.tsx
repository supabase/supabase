import { useState } from 'react'
import { Button, SidePanel } from 'ui'

import { useParams } from 'common'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Bucket,
  EdgeFunction,
  EdgeFunctions,
  Entities,
  Entity,
  Introduction,
  RPC,
  Realtime,
  Storage,
  StoredProcedures,
  UserManagement,
} from './Content'
import FirstLevelNav from './FirstLevelNav'
import LanguageSelector from './LanguageSelector'
import SecondLevelNav from './SecondLevelNav'

/**
 * [Joshen] Reminder: when we choose to release this as a main feature
 * Ensure that UX is better than the existing, and make sure we do the
 * necessary communications around releasing this.
 *
 * Problems:
 * - Needs URL support
 * - Language selector is not clear, users are missing the bash language option
 * - GraphiQL needs a better home, cannot be placed under Database as its "API"
 */

const ProjectAPIDocs = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const isEntityDocs =
    snap.activeDocsSection.length === 2 && snap.activeDocsSection[0] === 'entities'

  const [showKeys, setShowKeys] = useState(false)
  const language = snap.docsLanguage

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })

  const { anonKey } = getAPIKeys(settings)
  const apikey = showKeys
    ? anonKey?.api_key ?? 'SUPABASE_CLIENT_ANON_KEY'
    : 'SUPABASE_CLIENT_ANON_KEY'
  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint
  const endpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain?.hostname}`
      : `${protocol}://${hostEndpoint ?? ''}`

  return (
    <SidePanel
      hideFooter
      size="xxlarge"
      className="max-w-5xl"
      visible={snap.showProjectApiDocs}
      onCancel={() => snap.setShowProjectApiDocs(false)}
    >
      <div className="flex items-start h-full">
        <div className="w-72 border-r h-full">
          <div className="border-b px-4 py-2 flex items-center justify-between">
            <h4>API Docs</h4>
            <div className="flex items-center space-x-1">
              {!isEntityDocs && <LanguageSelector simplifiedVersion />}
              <Button type="default" onClick={() => setShowKeys(!showKeys)}>
                {showKeys ? 'Hide keys' : 'Show keys'}
              </Button>
            </div>
          </div>

          {snap.activeDocsSection.length === 1 ? <FirstLevelNav /> : <SecondLevelNav />}
        </div>

        <div className="flex-1 divide-y space-y-4 max-h-screen overflow-auto">
          {snap.activeDocsSection[0] === 'introduction' && (
            <Introduction
              showKeys={showKeys}
              language={language}
              apikey={apikey}
              endpoint={endpoint}
            />
          )}

          {snap.activeDocsSection[0] === 'user-management' && (
            <UserManagement language={language} apikey={apikey} endpoint={endpoint} />
          )}

          {snap.activeDocsSection[0] === 'realtime' && <Realtime language={language} />}

          {snap.activeDocsSection[0] === 'storage' && (
            <>
              {snap.activeDocsSection[1] !== undefined ? (
                <Bucket language={language} apikey={apikey} endpoint={endpoint} />
              ) : (
                <Storage language={language} />
              )}
            </>
          )}

          {snap.activeDocsSection[0] === 'edge-functions' && (
            <>
              {snap.activeDocsSection[1] !== undefined ? (
                <EdgeFunction language={language} apikey={apikey} endpoint={endpoint} />
              ) : (
                <EdgeFunctions language={language} />
              )}
            </>
          )}

          {snap.activeDocsSection[0] === 'entities' && (
            <>
              {snap.activeDocsSection[1] !== undefined ? (
                <Entity language={language} apikey={apikey} endpoint={endpoint} />
              ) : (
                <Entities language={language} />
              )}
            </>
          )}

          {snap.activeDocsSection[0] === 'stored-procedures' && (
            <>
              {snap.activeDocsSection[1] !== undefined ? (
                <RPC language={language} />
              ) : (
                <StoredProcedures language={language} />
              )}
            </>
          )}
        </div>
      </div>
    </SidePanel>
  )
}

export default ProjectAPIDocs
