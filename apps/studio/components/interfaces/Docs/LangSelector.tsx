import { useMemo } from 'react'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Key } from 'lucide-react'

import { useParams } from 'common'
import type { showApiKey } from 'components/interfaces/Docs/Docs.types'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
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

  const { data: apiKeys, isLoading: isLoadingAPIKeys } = useAPIKeysQuery({
    projectRef,
    reveal: false,
  })

  const legacyKeys = useMemo(() => apiKeys?.filter(({ type }) => type === 'legacy'), [apiKeys])
  const publishableKeys = useMemo(
    () => apiKeys?.filter(({ type }) => type === 'publishable'),
    [apiKeys]
  )
  const secretKeys = useMemo(() => apiKeys?.filter(({ type }) => type === 'secret'), [apiKeys])

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
        {selectedLang == 'bash' && !isLoadingAPIKeys && apiKeys && apiKeys.length > 0 && (
          <div className="flex">
            <div className="flex items-center gap-2 p-1 pl-2 text-xs text-foreground-lighter">
              <Key size={12} strokeWidth={1.5} />
              <span>Project API key:</span>
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

                  {publishableKeys && publishableKeys.length > 0 && (
                    <>
                      <DropdownMenuItem key="publishable" disabled>
                        Publishable keys
                      </DropdownMenuItem>
                      {publishableKeys.map((key) => (
                        <DropdownMenuItem
                          key={key.id}
                          onClick={() =>
                            setShowApiKey({
                              name: `Publishable key: ${key.name}`,
                              key: key.api_key,
                            })
                          }
                        >
                          {key.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  {secretKeys && secretKeys.length > 0 && (
                    <>
                      <DropdownMenuItem key="secret" disabled>
                        Secret keys
                      </DropdownMenuItem>
                      {secretKeys.map((key) => (
                        <DropdownMenuItem
                          key={key.id}
                          onClick={() =>
                            setShowApiKey({
                              name: `Secret key: ${key.name}`,
                              key: key.prefix + '...',
                            })
                          }
                        >
                          {key.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  <DropdownMenuItem key="legacy" disabled>
                    JWT-based legacy keys
                  </DropdownMenuItem>
                  {legacyKeys &&
                    legacyKeys.map((key) => (
                      <DropdownMenuItem
                        key={key.id}
                        onClick={() =>
                          setShowApiKey({ name: `${key.name} (legacy)`, key: key.api_key })
                        }
                      >
                        {key.name}
                      </DropdownMenuItem>
                    ))}
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
