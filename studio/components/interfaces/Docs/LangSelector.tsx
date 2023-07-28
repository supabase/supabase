import { FC } from 'react'
import { Button, Dropdown, IconKey } from 'ui'
import { useCheckPermissions } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { showApiKey } from 'components/interfaces/Docs/Docs.types'

const DEFAULT_KEY = { name: 'hide', key: 'IECHOR_KEY' }

interface Props {
  selectedLang: string
  setSelectedLang: (selectedLang: string) => void
  showApiKey: showApiKey
  setShowApiKey: (showApiKey: showApiKey) => void
  apiKey: string | undefined
  autoApiService: any
}

const LangSelector: FC<Props> = ({
  selectedLang,
  setSelectedLang,
  showApiKey,
  setShowApiKey,
  apiKey,
  autoApiService,
}) => {
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
              ? 'bg-scale-300 font-medium text-scale-1200 dark:bg-scale-200'
              : 'bg-scale-100 text-scale-900 dark:bg-scale-100'
          } relative inline-flex items-center border-r border-scale-200 p-1 px-2 text-sm transition hover:text-scale-1200 focus:outline-none`}
        >
          JavaScript
        </button>
        <button
          type="button"
          onClick={() => setSelectedLang('bash')}
          className={`${
            selectedLang == 'bash'
              ? 'bg-scale-300 font-medium text-scale-1200 dark:bg-scale-200'
              : 'bg-scale-100 text-scale-900 dark:bg-scale-100'
          } relative inline-flex items-center border-r border-scale-200 p-1 px-2 text-sm transition hover:text-scale-1200 focus:outline-none`}
        >
          Bash
        </button>
        {selectedLang == 'bash' && (
          <div className="flex">
            <div className="flex items-center gap-2 p-1 pl-2 text-xs text-scale-900">
              <IconKey size={12} strokeWidth={1.5} />
              <span>Project API key :</span>
            </div>
            <Dropdown
              align="end"
              side="bottom"
              className="cursor-pointer border-none bg-transparent p-0 pl-2 pr-8 text-sm text-scale-900"
              overlay={
                <>
                  <Dropdown.Item key="hide" onClick={() => setShowApiKey(DEFAULT_KEY)}>
                    hide
                  </Dropdown.Item>
                  {apiKey && (
                    <Dropdown.Item
                      key="anon"
                      onClick={() =>
                        setShowApiKey({
                          key: apiKey,
                          name: 'anon (public)',
                        })
                      }
                    >
                      anon (public)
                    </Dropdown.Item>
                  )}
                  {canReadServiceKey && (
                    <Dropdown.Item
                      key="service"
                      onClick={() =>
                        setShowApiKey({
                          key: autoApiService.serviceApiKey,
                          name: 'service_role (secret)',
                        })
                      }
                    >
                      service_role (secret)
                    </Dropdown.Item>
                  )}
                </>
              }
            >
              <Button type="default">{showApiKey.name}</Button>
            </Dropdown>
          </div>
        )}
      </div>
    </div>
  )
}

export default LangSelector
