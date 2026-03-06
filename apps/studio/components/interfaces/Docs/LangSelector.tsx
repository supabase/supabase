import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { EyeOff, Key } from 'lucide-react'
import { useMemo } from 'react'
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
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'

import type { ShowApiKey } from '@/components/interfaces/Docs/Docs.types'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }

interface LangSelectorProps {
  selectedLang: 'js' | 'bash'
  selectedApiKey: ShowApiKey
  setSelectedLang: (selectedLang: 'js' | 'bash') => void
  setSelectedApiKey: (key: ShowApiKey) => void
}

export const LangSelector = ({
  selectedLang,
  selectedApiKey,
  setSelectedLang,
  setSelectedApiKey,
}: LangSelectorProps) => {
  const { ref: projectRef } = useParams()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeys = [], isPending: isLoadingAPIKeys } = useAPIKeysQuery(
    {
      projectRef,
      reveal: false,
    },
    { enabled: canReadAPIKeys }
  )

  const legacyKeys = useMemo(() => apiKeys.filter(({ type }) => type === 'legacy'), [apiKeys])
  const publishableKeys = useMemo(
    () => apiKeys.filter(({ type }) => type === 'publishable'),
    [apiKeys]
  )
  const secretKeys = useMemo(() => apiKeys.filter(({ type }) => type === 'secret'), [apiKeys])

  return (
    <div className="flex items-center gap-x-1">
      <ToggleGroup
        type="single"
        value={selectedLang}
        variant="outline"
        onValueChange={(value) => {
          if (value) setSelectedLang(value as 'js' | 'bash')
        }}
        size="sm"
        className="flex-1 flex"
      >
        <ToggleGroupItem value="js" className="flex-1 px-2 py-1 h-7 text-xs">
          JavaScript
        </ToggleGroupItem>
        <ToggleGroupItem value="bash" className="flex-1 px-2 py-1 h-7 text-xs">
          Bash
        </ToggleGroupItem>
      </ToggleGroup>
      {selectedLang == 'bash' ? (
        canReadAPIKeys &&
        !isLoadingAPIKeys &&
        apiKeys &&
        apiKeys.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="default" size="tiny" className="p-0 h-7 w-7">
                {selectedApiKey.key === DEFAULT_KEY.key ? (
                  <EyeOff size={12} strokeWidth={1.5} />
                ) : (
                  <Key size={12} strokeWidth={1.5} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-48">
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

                {legacyKeys.length > 0 && (
                  <>
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
                  </>
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      ) : (
        <div className="w-7 h-7" />
      )}
    </div>
  )
}
