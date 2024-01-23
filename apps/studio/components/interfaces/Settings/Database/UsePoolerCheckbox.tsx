import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  Checkbox_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconAlertCircle,
  IconChevronDown,
  IconExternalLink,
  IconHelpCircle,
  Modal,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { Markdown } from 'components/interfaces/Markdown'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { SESSION_MODE_DESCRIPTION, TRANSACTION_MODE_DESCRIPTION } from './Database.constants'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'

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
  const [showHelper, setShowHelper] = useState(false)

  const { data, isLoading, isSuccess } = usePoolingConfigurationQuery({ projectRef })
  const { data: settings, isSuccess: isSuccessSettings } = useProjectSettingsQuery({ projectRef })

  const resolvesToIpV6 = !data?.supavisor_enabled && settings?.project.db_ip_addr_config === 'ipv6'

  const navigateToPoolerSettings = () => {
    const el = document.getElementById('connection-pooler')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <div className="flex gap-x-3">
        <Checkbox_Shadcn_
          id={`use-pooler-${id}`}
          checked={checked}
          onCheckedChange={() => onCheckedChange(!checked)}
        />
        <div className="-mt-[2px] flex flex-col gap-y-1 w-full">
          <label htmlFor={`use-pooler-${id}`} className="text-sm cursor-pointer">
            Use connection pooling
            {isSuccess && checked && data.supavisor_enabled && (
              <Badge color="scale" className="ml-2">
                Supavisor
              </Badge>
            )}
            {isSuccessSettings && (
              <Badge color="scale" className="ml-2">
                {checked
                  ? 'Resolves to IPv4'
                  : resolvesToIpV6
                  ? 'Resolves to IPv6'
                  : 'Will resolve to IPv6'}
              </Badge>
            )}
          </label>
          {checked && (
            <>
              <div className="flex items-center gap-x-2">
                <p className="text-sm text-foreground-light">Using pooling mode:</p>
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
                            <span className="capitalize">{poolingMode}</span>
                          </Button>
                        </div>
                      </PopoverTrigger_Shadcn_>
                      <PopoverContent_Shadcn_ className="p-0 w-[350px]" side="bottom" align="start">
                        <Command_Shadcn_>
                          <CommandList_Shadcn_>
                            <CommandGroup_Shadcn_>
                              <CommandItem_Shadcn_
                                value="transaction"
                                className="cursor-pointer w-full"
                                onSelect={() => {
                                  onSelectPoolingMode('transaction')
                                  setOpen(false)
                                }}
                                onClick={() => {
                                  onSelectPoolingMode('transaction')
                                  setOpen(false)
                                }}
                              >
                                <div className="flex flex-col gap-y-1">
                                  <p className="text-foreground">Transaction mode</p>
                                  <p>{TRANSACTION_MODE_DESCRIPTION}</p>
                                </div>
                              </CommandItem_Shadcn_>
                              <CommandItem_Shadcn_
                                value="session"
                                className="cursor-pointer w-full"
                                onSelect={() => {
                                  onSelectPoolingMode('session')
                                  setOpen(false)
                                }}
                                onClick={() => {
                                  onSelectPoolingMode('session')
                                  setOpen(false)
                                }}
                              >
                                <div className="flex flex-col gap-y-1">
                                  <p className="text-foreground">Session mode</p>
                                  <p>{SESSION_MODE_DESCRIPTION}</p>
                                </div>
                              </CommandItem_Shadcn_>
                            </CommandGroup_Shadcn_>
                          </CommandList_Shadcn_>
                        </Command_Shadcn_>
                      </PopoverContent_Shadcn_>
                    </Popover_Shadcn_>
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger asChild>
                        <Button
                          type="text"
                          icon={<IconHelpCircle strokeWidth={1.5} />}
                          className="p-0.5"
                          onClick={() => setShowHelper(true)}
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-alternative py-1 px-2 leading-none shadow',
                              'border border-background',
                            ].join(' ')}
                          >
                            <span className="text-xs text-foreground">
                              How to choose pooling modes
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </div>
                )}
              </div>
              {poolingMode === 'transaction' && data?.pool_mode === 'session' && (
                <Alert_Shadcn_ className="mb-2" variant="warning">
                  <IconAlertCircle strokeWidth={2} />
                  <AlertTitle_Shadcn_>
                    Pooling mode is currently configured to use Session mode
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    Set the pooling mode to Transaction in the{' '}
                    <span
                      className="text-foreground underline underline-offset-2 cursor-pointer"
                      tabIndex={0}
                      onClick={() => navigateToPoolerSettings()}
                    >
                      pooler configuration settings
                    </span>{' '}
                    to use Transaction mode over port 6543.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
            </>
          )}
          <Markdown
            extLinks
            className="[&>p]:m-0 space-y-1 text-foreground-lighter max-w-full"
            content={`
IPv4 and IPv6 connections will resolve while using connection pooling\n
A connection pooler is useful for managing a large number of temporary connections. [Learn more](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)`}
          />
        </div>
      </div>

      <Modal
        hideFooter
        visible={showHelper}
        header={
          <div className="w-full flex items-center justify-between">
            <p>Which pooling mode should I use?</p>
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <a
                href="https://supabase.com/docs/guides/database/connecting-to-postgres#how-connection-pooling-works"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </a>
            </Button>
          </div>
        }
        onCancel={() => setShowHelper(false)}
      >
        <Modal.Content className="py-4 text-sm flex flex-col gap-y-4">
          <p className="text-foreground-light">
            A "connection pool" is a system (external to Postgres) which manages Postgres
            connections by allocating connections whenever clients make requests. Each pooling mode
            handles connections differently.
          </p>
          <div className="flex flex-col gap-y-1">
            <p>Transaction mode (Port: 6543)</p>
            <p className="text-foreground-light">
              Recommended if you are connecting from{' '}
              <span className="text-foreground">serverless environments</span> since the same
              database connection can be re-used across multiple clients connecting to the pooler.{' '}
              <span className="text-amber-900">
                Prepared statements don't work in transaction mode
              </span>
              .
            </p>
          </div>
          <div className="flex flex-col gap-y-1">
            <p>Session mode (Port: 5432)</p>
            <p className="text-foreground-light">
              Similar to connecting to your database directly. There is{' '}
              <span className="text-foreground">full support for prepared statements</span> but a
              new database connection is created for each client and you{' '}
              <span className="text-amber-900">might run into database connection limits</span>.
            </p>
          </div>
          <p className="text-foreground-light">
            You can use each pooling mode by either using their corresponding port numbers, or by
            setting the pooling mode in the{' '}
            <span
              tabIndex={0}
              className="text-foreground cursor-pointer underline underline-offset-2"
              onClick={() => {
                setShowHelper(false)
                navigateToPoolerSettings()
              }}
            >
              connection pooling configuration settings
            </span>
            .
          </p>
          <p className="text-foreground-light">
            Setting the pooling mode as a pooler configuration{' '}
            <span className="text-foreground">takes highest precendence</span>. (If your pooling
            mode has been set to Session, you will not be able to use Transaction mode over port
            6543)
          </p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex items-center justify-end pb-2">
          <Button type="default" onClick={() => setShowHelper(false)}>
            Understood
          </Button>
        </Modal.Content>
      </Modal>
    </>
  )
}
