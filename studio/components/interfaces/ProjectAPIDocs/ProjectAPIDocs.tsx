import { useState } from 'react'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconTerminal,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  SidePanel,
} from 'ui'

import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { BASE_PATH } from 'lib/constants'
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
import SecondLevelNav from './SecondLevelNav'

const ProjectAPIDocs = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  const [openLanguage, setOpenLanguage] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  const [language, setLanguage] = useState<'js' | 'bash'>('js')

  const { data } = useProjectApiQuery({ projectRef: ref })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })

  const apikey = showKeys
    ? data?.autoApiService.defaultApiKey ?? 'SUPABASE_CLIENT_ANON_KEY'
    : 'SUPABASE_CLIENT_ANON_KEY'
  const endpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain?.hostname}/auth/v1/callback`
      : `https://${data?.autoApiService.endpoint ?? ''}`

  const updateLanguage = (value: 'js' | 'bash') => {
    setLanguage(value)
    setOpenLanguage(false)
  }

  return (
    <SidePanel
      hideFooter
      size="xxlarge"
      className="max-w-5xl"
      visible={snap.showProjectApiDocs}
      onCancel={() => snap.setShowProjectApiDocs(false)}
    >
      <div className="flex items-start h-full">
        <div className="w-64 border-r h-full">
          <div className="border-b px-4 py-2 flex items-center justify-between">
            <h4>API Docs</h4>
            <div className="flex items-center space-x-1">
              <Popover_Shadcn_ open={openLanguage} onOpenChange={setOpenLanguage} modal={false}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button
                    type="default"
                    className="px-1"
                    icon={
                      language === 'js' ? (
                        <img
                          src={`${BASE_PATH}/img/libraries/javascript-icon.svg`}
                          alt={`javascript logo`}
                          width="14"
                        />
                      ) : (
                        <IconTerminal size={14} strokeWidth={2.5} />
                      )
                    }
                  />
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="p-0 w-24" side="bottom" align="end">
                  <Command_Shadcn_>
                    <CommandList_Shadcn_>
                      <CommandGroup_Shadcn_>
                        <CommandItem_Shadcn_
                          className="cursor-pointer"
                          onSelect={() => updateLanguage('js')}
                          onClick={() => updateLanguage('js')}
                        >
                          <p>Javascript</p>
                        </CommandItem_Shadcn_>
                        <CommandItem_Shadcn_
                          className="cursor-pointer"
                          onSelect={() => updateLanguage('bash')}
                          onClick={() => updateLanguage('bash')}
                        >
                          <p>Bash</p>
                        </CommandItem_Shadcn_>
                      </CommandGroup_Shadcn_>
                    </CommandList_Shadcn_>
                  </Command_Shadcn_>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
              <Button type="default" onClick={() => setShowKeys(!showKeys)}>
                {showKeys ? 'Hide keys' : 'Show keys'}
              </Button>
            </div>
          </div>

          {snap.activeDocsSection.length === 1 ? <FirstLevelNav /> : <SecondLevelNav />}
        </div>

        <div className="flex-1 divide-y space-y-4 max-h-screen overflow-auto px-4">
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
                <Bucket language={language} />
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
