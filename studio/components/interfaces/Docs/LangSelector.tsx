import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useCheckPermissions } from 'hooks'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconKey,
} from 'ui'

import { showApiKey } from 'components/interfaces/Docs/Docs.types'

const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }

interface LangSelectorProps {
  selectedLang: string
  setSelectedLang: (selectedLang: string) => void
  showApiKey: showApiKey
  setShowApiKey: (showApiKey: showApiKey) => void
  apiKey: string | undefined
  autoApiService: any
}

const LangSelector = ({
  selectedLang,
  setSelectedLang,
  showApiKey,
  setShowApiKey,
  apiKey,
  autoApiService,
}: LangSelectorProps) => {
  const canReadServiceKey = useCheckPermissions(
    PermissionAction.READ,
    'service_api_keys.service_role_key'
  )

  return (
    <div className="p-1 w-1/2 ml-auto">
      <div className="z-0 flex justify-end">
        <button
          type="button"
          onClick={() => setSelectedLang('js')}
          className={`${
            selectedLang == 'js'
              ? 'bg-scale-300 font-medium text-foreground dark:bg-scale-200'
              : 'bg-scale-100 text-scale-900 dark:bg-scale-100'
          } relative inline-flex items-center border-r border-scale-200 p-1 px-2 text-sm transition hover:text-foreground focus:outline-none`}
        >
          JavaScript
        </button>
        <button
          type="button"
          onClick={() => setSelectedLang('bash')}
          className={`${
            selectedLang == 'bash'
              ? 'bg-scale-300 font-medium text-foreground dark:bg-scale-200'
              : 'bg-scale-100 text-scale-900 dark:bg-scale-100'
          } relative inline-flex items-center border-r border-scale-200 p-1 px-2 text-sm transition hover:text-foreground focus:outline-none`}
        >
          Bash
        </button>
        {selectedLang == 'bash' && (
          <div className="flex">
            <div className="flex items-center gap-2 p-1 pl-2 text-xs text-scale-900">
              <IconKey size={12} strokeWidth={1.5} />
              <span>Project API key :</span>
            </div>
            <DropdownMenu_Shadcn_>
              <DropdownMenuTrigger_Shadcn_>
                <Button type="default">{showApiKey.name}</Button>
              </DropdownMenuTrigger_Shadcn_>
              <DropdownMenuContent_Shadcn_ align="end" side="bottom">
                <>
                  <DropdownMenuItem_Shadcn_ key="hide" onClick={() => setShowApiKey(DEFAULT_KEY)}>
                    hide
                  </DropdownMenuItem_Shadcn_>
                  {apiKey && (
                    <DropdownMenuItem_Shadcn_
                      key="anon"
                      onClick={() =>
                        setShowApiKey({
                          key: apiKey,
                          name: 'anon (public)',
                        })
                      }
                    >
                      <p className="text">anon (public)</p>
                    </DropdownMenuItem_Shadcn_>
                  )}
                  {canReadServiceKey && (
                    <DropdownMenuItem_Shadcn_
                      key="service"
                      onClick={() =>
                        setShowApiKey({
                          key: autoApiService.serviceApiKey,
                          name: 'service_role (secret)',
                        })
                      }
                    >
                      <p className="text">service_role (secret)</p>
                    </DropdownMenuItem_Shadcn_>
                  )}
                </>
              </DropdownMenuContent_Shadcn_>
            </DropdownMenu_Shadcn_>
          </div>
        )}
      </div>
    </div>
  )
}

export default LangSelector
