import { Key } from 'lucide-react'
import { useMemo } from 'react'

import { useParams } from 'common'
import type { showApiKey } from 'components/interfaces/Docs/Docs.types'
import { useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }

interface LangSelectorProps {
  selectedLang: string
  selectedApiKey: showApiKey
  setSelectedLang: (selectedLang: string) => void
  setSelectedApiKey: (showApiKey: showApiKey) => void
}

const LangSelector = ({
  selectedLang,
  selectedApiKey,
  setSelectedLang,
  setSelectedApiKey,
}: LangSelectorProps) => {
  const { ref: projectRef } = useParams()

  const { data: apiKeys = [], isLoading: isLoadingAPIKeys } = useAPIKeysQuery({
    projectRef,
    reveal: false,
  })

  const legacyKeys = useMemo(() => apiKeys.filter(({ type }) => type === 'legacy'), [apiKeys])
  const publishableKeys = useMemo(
    () => apiKeys.filter(({ type }) => type === 'publishable'),
    [apiKeys]
  )
  const secretKeys = useMemo(() => apiKeys.filter(({ type }) => type === 'secret'), [apiKeys])

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
          <div className="flex gap-x-1">
            <div className="flex items-center gap-2 p-1 pl-2 text-xs text-foreground-lighter">
              <Key size={12} strokeWidth={1.5} />
              <span>Project API key:</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="outline">
                  {selectedApiKey.name === 'hide' ? 'Hide keys' : selectedApiKey.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuRadioGroup value={selectedApiKey.key}>
                  <DropdownMenuRadioItem
                    key="hide"
                    value={DEFAULT_KEY.key}
                    onClick={() => setSelectedApiKey(DEFAULT_KEY)}
                  >
                    Hide keys
                  </DropdownMenuRadioItem>

                  {publishableKeys.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Publishable keys</DropdownMenuLabel>
                      {publishableKeys.map((key) => {
                        const value = key.api_key
                        return (
                          <DropdownMenuRadioItem
                            key={key.id}
                            value={value}
                            onClick={() =>
                              setSelectedApiKey({
                                name: `Publishable key: ${key.name}`,
                                key: value,
                              })
                            }
                          >
                            {key.name}
                          </DropdownMenuRadioItem>
                        )
                      })}
                    </>
                  )}

                  {secretKeys.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Secret keys</DropdownMenuLabel>
                      {secretKeys.map((key) => {
                        const value = key.prefix + '...'
                        return (
                          <DropdownMenuRadioItem
                            key={key.id}
                            value={value}
                            onClick={() =>
                              setSelectedApiKey({ name: `Secret key: ${key.name}`, key: value })
                            }
                          >
                            {key.name}
                          </DropdownMenuRadioItem>
                        )
                      })}
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuLabel>JWT-based legacy keys</DropdownMenuLabel>
                    {legacyKeys.map((key) => {
                      const value = key.api_key
                      return (
                        <DropdownMenuRadioItem
                          key={key.id}
                          value={value}
                          onClick={() =>
                            setSelectedApiKey({ name: `Legacy key: ${key.name}`, key: value })
                          }
                        >
                          {key.name}
                        </DropdownMenuRadioItem>
                      )
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}

export default LangSelector
