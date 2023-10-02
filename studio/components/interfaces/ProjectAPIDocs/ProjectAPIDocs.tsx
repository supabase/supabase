import { useState } from 'react'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  SidePanel,
} from 'ui'

import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
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
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'

const ProjectAPIDocs = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const [open, setOpen] = useState(false)
  const [useServiceKey, setUseServiceKey] = useState(false)
  const [language, setLanguage] = useState<'js' | 'bash'>('js')

  const { data } = useProjectApiQuery({ projectRef: ref })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })
  const apikey = useServiceKey ? 'SUPABASE_SERVICE_KEY' : 'SUPABASE_CLIENT_API_KEY'
  const endpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain?.hostname}/auth/v1/callback`
      : `https://${data?.autoApiService.endpoint ?? ''}`

  const updateLanguage = (value: 'js' | 'bash') => {
    setLanguage(value)
    setOpen(false)
  }

  // [Joshen] need to consider custom domains

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
            <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="default">{language === 'js' ? 'Javascript' : 'Bash'}</Button>
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
          </div>

          {snap.activeDocsSection.length === 1 ? <FirstLevelNav /> : <SecondLevelNav />}
        </div>

        <div className="flex-1 divide-y space-y-4 max-h-screen overflow-auto">
          {snap.activeDocsSection[0] === 'introduction' && (
            <Introduction language={language} apikey={apikey} endpoint={endpoint} />
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
