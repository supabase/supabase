import { PermissionAction } from '@supabase/shared-types/out/constants'

import type { showApiKey } from 'components/interfaces/Docs/Docs.types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconKey,
} from 'ui'

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
              ? 'bg-surface-100 font-medium text-foreground'
              : 'bg-alternative text-foreground-lighter'
          } relative inline-flex items-center border-r border-background p-1 px-2 text-sm transition hover:text-foreground focus:outline-none`}
        >
          JavaScript
        </button>
        <button
          type="button"
          onClick={() => setSelectedLang('bash')}
          className={`${
            selectedLang == 'bash'
              ? 'bg-surface-100 font-medium text-foreground'
              : 'bg-alternative text-foreground-lighter'
          } relative inline-flex items-center border-r border-background p-1 px-2 text-sm transition hover:text-foreground focus:outline-none`}
        >
          Bash
        </button>
        {selectedLang == 'bash' && (
          <div className="flex">
            <div className="flex items-center gap-2 p-1 pl-2 text-xs text-foreground-lighter">
              <IconKey size={12} strokeWidth={1.5} />
              <span>Project API key :</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default">{showApiKey.name}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <>
                  <DropdownMenuItem key="hide" onClick={() => setShowApiKey(DEFAULT_KEY)}>
                    hide
                  </DropdownMenuItem>
                  {apiKey && (
                    <DropdownMenuItem
                      key="anon"
                      onClick={() =>
                        setShowApiKey({
                          key: apiKey,
                          name: 'anon (public)',
                        })
                      }
                    >
                      <p>anon (public)</p>
                    </DropdownMenuItem>
                  )}
                  {canReadServiceKey && (
                    <DropdownMenuItem
                      key="service"
                      onClick={() =>
                        setShowApiKey({
                          key: autoApiService.serviceApiKey,
                          name: 'service_role (secret)',
                        })
                      }
                    >
                      <p>service_role (secret)</p>
                    </DropdownMenuItem>
                  )}
                </>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}

export default LangSelector
