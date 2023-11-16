import { PlusCircle } from 'lucide-react'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import {
  Button,
  IconKey,
  IconUnlock,
  IconUser,
  Input,
  Listbox,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import { RealtimeConfig } from '../useRealtimeMessages'
import Link from 'next/link'

interface RealtimeTokensPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeTokensPopover = ({ config, onChangeConfig }: RealtimeTokensPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)

  const { data: settings } = useProjectSettingsQuery({ projectRef: config.projectRef })

  const apiService = (settings?.services ?? []).find(
    (x) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
  )
  const apiKeys = apiService?.service_api_keys ?? []
  const selectedToken = apiKeys.find((k) => k.api_key === tempConfig.token)
  const bearerEnabled = selectedToken?.tags === 'anon'

  const isService = config.token === apiKeys.find((key) => key.tags === 'service_role')?.api_key

  useEffect(() => {
    const anonKey = apiKeys.find((k) => k.tags === 'anon')
    if (anonKey) {
      onChangeConfig({ ...config, token: anonKey.api_key })
    }
  }, [apiKeys])

  const onOpen = (v: boolean) => {
    // when opening, copy the outside config into the intermediate one
    if (v === true) {
      setTempConfig(config)
    }
    setOpen(v)
  }

  const onApply = () => {
    onChangeConfig(tempConfig)
    setOpen(false)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={onOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          icon={<PlusCircle size={16} />}
          type="dashed"
          className="rounded-full px-1.5 pr-2 !py-1 text-xs"
          size="small"
        >
          {isService
            ? 'Bypassing RLS policies'
            : config.bearer
            ? 'Viewing events as user'
            : 'Test RLS policies'}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[500px] p-0" align="start">
        <div className="border-b border-overlay p-4 flex-grow flex flex-col gap-y-3">
          <p className="text-sm text-foreground">Connection key settings</p>
          <Listbox
            type="select"
            value={tempConfig.token}
            size="small"
            className="w-full"
            onChange={(key) => {
              const selectedToken = apiKeys.find((k) => k.api_key === key)
              if (selectedToken) {
                if (selectedToken.tags === 'anon') {
                  setTempConfig({ ...config, token: key, bearer: '' })
                } else {
                  setTempConfig({ ...config, token: key, bearer: '' })
                }
              }
            }}
          >
            {apiKeys.map((key) => {
              return (
                <Listbox.Option key={key.tags} label={key.tags} value={key.api_key}>
                  <span className="text-foreground">{key.tags}</span>
                </Listbox.Option>
              )
            })}
          </Listbox>
          {selectedToken?.tags === 'service_role' ? (
            <span className="text-sm text-foreground-light">
              The <span className="text-foreground">Service role</span> is a predefined Postgres
              role with elevated privileges. It will bypass all Row Level Security (RLS) policies.
            </span>
          ) : (
            <span className="text-sm text-foreground-light">
              The <span className="text-foreground">anonymous key</span> will respect Row Level
              Security (RLS) policies.
            </span>
          )}
        </div>
        {bearerEnabled && (
          <div className="border-b border-overlay p-4 flex-grow flex flex-col gap-y-2">
            <p className="text-sm text-foreground">Impersonate a user</p>
            <p className="text-sm text-foreground-light">
              Provide a JWT token of a user to receive events from the perspective of the user. This
              respects RLS policies relevant for that particular user.
            </p>
            <Input
              icon={<IconKey />}
              size="small"
              className="flex-grow mt-2"
              placeholder="Enter JWT token of a user"
              defaultValue={tempConfig.bearer || ''}
              onChange={(v) => setTempConfig({ ...tempConfig, bearer: v.target.value })}
            />
            <p className="text-xs text-foreground-light">
              Learn more about JWT tokens in{' '}
              <Link
                className="underline"
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/learn/auth-deep-dive/auth-deep-dive-jwts"
              >
                our docs
              </Link>
            </p>
          </div>
        )}
        <div className="px-4 py-3 gap-2 flex justify-end">
          <Button type="default" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onApply}>Apply</Button>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
