import { PlusCircle } from 'lucide-react'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import {
  Button,
  IconKey,
  Input,
  Listbox,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Toggle,
} from 'ui'

import { RealtimeConfig } from '../useRealtimeEvents'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'

interface RealtimeTokensPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeTokensPopover = ({ config, onChangeConfig }: RealtimeTokensPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [bearerEnabled, setBearerEnabled] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)

  const { data: settings } = useProjectSettingsQuery({ projectRef: config.projectRef })

  const apiService = (settings?.services ?? []).find(
    (x) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
  )
  const apiKeys = apiService?.service_api_keys ?? []

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
          icon={<PlusCircle size="16" />}
          type="dashed"
          className="rounded-[28px]"
          size="small"
        >
          <span className="text-xs">Test RLS policies</span>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[650px] p-0" align="start">
        <div className="border-b border-overlay text-xs p-4 text-foreground-light">Tokens</div>
        <div className="border-b border-overlay p-4 flex flex-row gap-2">
          <span className="text-sm w-96">Token type</span>
          <div className="flex-grow flex flex-col gap-y-1">
            <Listbox
              type="select"
              value={tempConfig.token}
              size="tiny"
              className="w-full"
              onChange={(v) => setTempConfig({ ...config, token: v })}
            >
              {apiKeys.map((key) => {
                return (
                  <Listbox.Option key={key.tags} label={key.tags} value={key.api_key}>
                    <span className="text-foreground">{key.tags}</span>
                  </Listbox.Option>
                )
              })}
            </Listbox>
            <span className="text-sm text-foreground-light">
              The type of token used. Using <code>service_role</code> will bypass RLS policies. If
              you want to test RLS policies with realtime events, you should use <code>anon</code>.
            </span>
          </div>
        </div>
        <div className="border-b border-overlay p-4 flex flex-row gap-4">
          <div className="pt-0.5">
            <Toggle
              size="small"
              checked={bearerEnabled}
              onChange={() => {
                const flag = !bearerEnabled
                if (flag === false) {
                  setTempConfig({ ...tempConfig, bearer: '' })
                }
                setBearerEnabled(flag)
              }}
            />
          </div>
          <div className="flex flex-col gap-y-1 flex-grow">
            <p className="text-sm">Impersonate User</p>
            <p className="text-sm text-foreground-light">
              Use a JWT token to test any RLS policies. The token type should be set to{' '}
              <code>anon</code>.
            </p>
            <Input
              icon={<IconKey />}
              size="small"
              className="flex-grow"
              disabled={!bearerEnabled}
              defaultValue={tempConfig.bearer || ''}
              onChange={(v) => setTempConfig({ ...tempConfig, bearer: v.target.value })}
            />
          </div>
        </div>
        <div className="p-4 gap-2 flex justify-end">
          <Button type="default" onClick={() => setOpen(false)}>
            <span>Cancel</span>
          </Button>
          <Button onClick={onApply}>
            <span>Apply</span>
          </Button>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
