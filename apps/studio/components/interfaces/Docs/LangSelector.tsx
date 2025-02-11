import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Key } from 'lucide-react'

import { useParams } from 'common'
import type { showApiKey } from 'components/interfaces/Docs/Docs.types'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }

interface LangSelectorProps {
  selectedLang: string
  showApiKey: showApiKey
  setSelectedLang: (selectedLang: string) => void
  setShowApiKey: (showApiKey: showApiKey) => void
}

const LangSelector = ({
  selectedLang,
  showApiKey,
  setSelectedLang,
  setShowApiKey,
}: LangSelectorProps) => {
  const { ref: projectRef } = useParams()
  const canReadServiceKey = useCheckPermissions(
    PermissionAction.READ,
    'service_api_keys.service_role_key'
  )

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { anonKey: anonApiKey, serviceKey: serviceApiKey } = getAPIKeys(settings)

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
              <Key size={12} strokeWidth={1.5} />
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
                  {anonApiKey && (
                    <DropdownMenuItem
                      key="anon"
                      onClick={() =>
                        setShowApiKey({
                          key: anonApiKey.api_key ?? '-',
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
                          key: serviceApiKey?.api_key ?? '-',
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
