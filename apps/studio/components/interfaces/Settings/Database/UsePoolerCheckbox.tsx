import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import { useState } from 'react'
import {
  Badge,
  Button,
  Checkbox_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconChevronDown,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Separator,
} from 'ui'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { useDatabaseSettingsStateSnapshot } from 'state/database-settings'

interface UsePoolerCheckboxInterface {
  id: string
  checked: boolean
  poolingMode: 'transaction' | 'session' | 'statement'
  onCheckedChange: (value: boolean) => void
  onSelectPoolingMode: (mode: 'transaction' | 'session') => void
}

export const UsePoolerCheckbox = ({
  id,
  checked,
  poolingMode = 'transaction',
  onCheckedChange,
  onSelectPoolingMode,
}: UsePoolerCheckboxInterface) => {
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)
  const snap = useDatabaseSettingsStateSnapshot()

  const { data, isLoading, isSuccess } = usePoolingConfigurationQuery({ projectRef })
  const { data: settings, isSuccess: isSuccessSettings } = useProjectSettingsQuery({ projectRef })

  const resolvesToIpV6 = !data?.supavisor_enabled && settings?.project.db_ip_addr_config === 'ipv6'

  return (
    <>
      <div className="flex flex-col gap-y-1">
        <div className="flex gap-x-3">
          <Checkbox_Shadcn_
            id={`use-pooler-${id}`}
            checked={checked}
            onCheckedChange={() => onCheckedChange(!checked)}
          />
          <div className="-mt-[2px] flex flex-col gap-y-1 w-full">
            <div className="flex items-center gap-x-4">
              <div className="flex items-center gap-x-2">
                <label htmlFor={`use-pooler-${id}`} className="text-sm cursor-pointer">
                  Use connection pooling
                </label>
                {checked && (
                  <>
                    <div className="flex items-center gap-x-2">
                      {isLoading && <ShimmeringLoader className="w-[100px] py-2.5" />}
                      {isSuccess && (
                        <div className="flex items-center gap-x-1">
                          <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
                            <PopoverTrigger_Shadcn_ asChild>
                              <div className="flex items-center space-x-2 cursor-pointer">
                                <Button
                                  type="outline"
                                  className="py-0.5 pr-1.5"
                                  iconRight={<IconChevronDown strokeWidth={1.5} />}
                                >
                                  <span className="capitalize">Mode: {poolingMode}</span>
                                </Button>
                              </div>
                            </PopoverTrigger_Shadcn_>
                            <PopoverContent_Shadcn_
                              className="p-0 w-52"
                              side="bottom"
                              align="start"
                            >
                              <Command_Shadcn_>
                                <CommandList_Shadcn_>
                                  <CommandGroup_Shadcn_>
                                    <CommandItem_Shadcn_
                                      disabled={data.pool_mode === 'session'}
                                      value="transaction"
                                      className={`w-full text-foreground ${
                                        data.pool_mode === 'session'
                                          ? 'cursor-default'
                                          : 'cursor-pointer'
                                      }`}
                                      onSelect={() => {
                                        onSelectPoolingMode('transaction')
                                        setOpen(false)
                                      }}
                                      onClick={() => {
                                        onSelectPoolingMode('transaction')
                                        setOpen(false)
                                      }}
                                    >
                                      <Tooltip.Root delayDuration={0}>
                                        <Tooltip.Trigger asChild>
                                          <span className="w-full">Transaction mode</span>
                                        </Tooltip.Trigger>
                                        {data.pool_mode === 'session' && (
                                          <Tooltip.Portal>
                                            <Tooltip.Content side="right">
                                              <Tooltip.Arrow className="radix-tooltip-arrow" />
                                              <div
                                                className={[
                                                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                                                  'border border-background w-[380px]',
                                                ].join(' ')}
                                              >
                                                <span className="text-xs text-foreground">
                                                  Pooling mode is currently configured to use
                                                  session mode. If you want to use both session mode
                                                  and transaction mode at the same time, change the
                                                  pooling mode to transaction first in the pooler
                                                  configuration settings. You can then connect to
                                                  session mode on port 5432 and transaction mode on
                                                  port 6543
                                                </span>
                                              </div>
                                            </Tooltip.Content>
                                          </Tooltip.Portal>
                                        )}
                                      </Tooltip.Root>
                                    </CommandItem_Shadcn_>
                                    <CommandItem_Shadcn_
                                      value="session"
                                      className="cursor-pointer w-full text-foreground"
                                      onSelect={() => {
                                        onSelectPoolingMode('session')
                                        setOpen(false)
                                      }}
                                      onClick={() => {
                                        onSelectPoolingMode('session')
                                        setOpen(false)
                                      }}
                                    >
                                      Session mode
                                    </CommandItem_Shadcn_>
                                  </CommandGroup_Shadcn_>
                                </CommandList_Shadcn_>
                              </Command_Shadcn_>
                              <Separator />
                              <p
                                className="px-3 py-2 text-xs text-foreground-light hover:text-foreground cursor-pointer transition"
                                onClick={() => snap.setShowPoolingModeHelper(true)}
                              >
                                How to choose pooling modes?
                              </p>
                            </PopoverContent_Shadcn_>
                          </Popover_Shadcn_>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-x-1">
                {isSuccess && checked && data.supavisor_enabled && (
                  <Badge color="scale">Supavisor</Badge>
                )}
                {isSuccessSettings && (
                  <Badge color="scale">
                    {checked
                      ? 'Resolves to IPv4'
                      : resolvesToIpV6
                      ? 'Resolves to IPv6'
                      : 'Will resolve to IPv6'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
